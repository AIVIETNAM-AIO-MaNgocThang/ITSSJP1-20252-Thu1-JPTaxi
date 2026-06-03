import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../api/accounts.js';
import { getActiveDriverRide, updateDriverLocation } from '../api/rides.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { getChatPath } from '../utils/chatSession.js';
import { DEFAULT_MAP_LOCATION, watchBrowserLocation } from '../utils/geolocation.js';
import { setLastInvoiceTripId } from '../utils/invoiceSession.js';
import { fetchDrivingRoute, formatDistance, formatDuration, hasDrivingRoutePath } from '../utils/routePlanner.js';
import '../styles/app-pages.css';

const driverFallbackAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

const fallbackRoute = {
  destination: {
    name: 'ロッテホテル ハノイ',
    address: '54 Lieu Giai, Ba Dinh, Ha Noi',
    position: [21.03205, 105.81283],
  },
  pickup: {
    name: 'ホアンキエム湖',
    position: [21.02878, 105.85204],
  },
  routeMetrics: {
    duration: '12分',
    distance: '4.8 km',
  },
  routePath: [
    [21.02878, 105.85204],
    [21.02812, 105.85046],
    [21.02672, 105.84817],
    [21.02482, 105.85672],
    [21.02621, 105.84666],
    [21.02942, 105.83628],
    [21.03162, 105.82084],
    [21.03205, 105.81283],
  ],
};

function readSelectedRoute() {
  try {
    const rawRoute = window.sessionStorage.getItem('jpTaxiSelectedRoute');
    if (!rawRoute) return fallbackRoute;

    const parsedRoute = JSON.parse(rawRoute);
    const pickupPosition = parsedRoute.pickup?.position;
    const destinationPosition = parsedRoute.destination?.position;

    if (!Array.isArray(pickupPosition) || !Array.isArray(destinationPosition)) {
      return fallbackRoute;
    }

    return {
      ...fallbackRoute,
      ...parsedRoute,
      routePath: hasDrivingRoutePath(parsedRoute.routePath) ? parsedRoute.routePath : [],
      routeMetrics: {
        ...fallbackRoute.routeMetrics,
        ...parsedRoute.routeMetrics,
      },
    };
  } catch {
    return fallbackRoute;
  }
}

export default function DriverRideStatusPage() {
  const [selectedRoute, setSelectedRoute] = useState(readSelectedRoute);
  const [driverLocation, setDriverLocation] = useState(null);
  const [topbarAvatar, setTopbarAvatar] = useState(() => (
    resolveAssetUrl(localStorage.getItem('jpTaxiDriverAvatarUrl')) || driverFallbackAvatar
  ));
  const passenger = selectedRoute.passenger || {};
  const passengerName = passenger.name || 'JPTX-9821';
  const passengerPhone = passenger.phone || '090-1234-5678';
  const passengerAvatar = resolveAssetUrl(passenger.avatarUrl);

  useEffect(() => {
    function syncTopbarAvatar() {
      setTopbarAvatar(resolveAssetUrl(localStorage.getItem('jpTaxiDriverAvatarUrl')) || driverFallbackAvatar);
    }

    syncTopbarAvatar();
    window.addEventListener('storage', syncTopbarAvatar);
    window.addEventListener('focus', syncTopbarAvatar);

    return () => {
      window.removeEventListener('storage', syncTopbarAvatar);
      window.removeEventListener('focus', syncTopbarAvatar);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchDrivingRoute(
      selectedRoute.pickup.position,
      selectedRoute.destination.position,
      { signal: controller.signal },
    )
      .then((route) => {
        setSelectedRoute((current) => {
          const nextRoute = {
            ...current,
            routePath: route.routePath,
            routeMetrics: {
              ...current.routeMetrics,
              distance: formatDistance(route.distance),
              duration: formatDuration(route.duration, route.distance),
              distanceMeters: route.distance,
            },
          };
          window.sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify(nextRoute));
          return nextRoute;
        });
      })
      .catch(() => {
        /* Keep the stored route when the routing service is unavailable. */
      });

    return () => controller.abort();
  }, [selectedRoute.destination.position, selectedRoute.pickup.position]);

  useEffect(() => {
    let ignore = false;

    const stopWatching = watchBrowserLocation(
      (location) => {
        if (ignore || location.isFallback) return;
        const nextLocation = [location.latitude, location.longitude];
        setDriverLocation(nextLocation);
        updateDriverLocation({ lat: location.latitude, lng: location.longitude }).catch(() => {
          /* Keep local map responsive when location sync is temporarily unavailable. */
        });
      },
      { fallback: DEFAULT_MAP_LOCATION, emitFallback: false },
    );

    return () => {
      ignore = true;
      stopWatching();
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function syncActiveRide() {
      try {
        const activeRide = await getActiveDriverRide();
        if (ignore || activeRide?.type !== 'trip') return;
        if (activeRide.data?.tripId) {
          sessionStorage.setItem('jpTaxiTripId', String(activeRide.data.tripId));
          setLastInvoiceTripId(activeRide.data.tripId);
        }

        setSelectedRoute((current) => {
          const nextRoute = {
            ...current,
            passenger: {
              ...(current.passenger || {}),
              ...(activeRide.data.passenger || {}),
            },
          };
          window.sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify(nextRoute));
          return nextRoute;
        });
      } catch {
        /* Keep the stored passenger data when the active ride API is unavailable. */
      }
    }

    syncActiveRide();
    const timer = window.setInterval(syncActiveRide, 5000);

    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);

  const routePoints = [
    {
      key: 'pickup',
      label: selectedRoute.pickup.name,
      meta: '乗車地',
      time: '現在',
      position: selectedRoute.pickup.position,
      type: 'pickup',
    },
    {
      key: 'destination',
      label: selectedRoute.destination.name,
      meta: selectedRoute.destination.address,
      time: `約${selectedRoute.routeMetrics.duration}`,
      position: selectedRoute.destination.position,
      type: 'destination',
    },
  ];

  return (
    <PageShell>
      <main className="driver-tracking-screen">
        <Topbar
          brandTo="/driver-home"
          actions={(
            <>
              <Link to="/driver-home">ホーム</Link>
              <Link to={getChatPath('customer')}>メッセージ</Link>
              <Link to="/driver-info/basic">アカウント</Link>
              <img className="topbar-avatar driver-avatar-top" src={topbarAvatar} alt="" />
            </>
          )}
        />

        <section className="driver-tracking-map">
          <InteractiveRouteMap
            alternateRoutePath={[]}
            className="tracking-route-map"
            compact
            currentLocation={selectedRoute.pickup.position}
            driverPosition={driverLocation || selectedRoute.pickup.position}
            route={routePoints}
            routePath={selectedRoute.routePath}
            routeSummary={`${selectedRoute.routeMetrics.distance} - ${selectedRoute.routeMetrics.duration}`}
            scrollWheelZoom
            showCurrentLocation={false}
            showDetails={false}
            showRoute={hasDrivingRoutePath(selectedRoute.routePath)}
          />

          <section className="driver-tracking-card">
            <div className="tracking-eta-header">
              <div>
                <span>到着予定時間</span>
                <strong>あと {selectedRoute.routeMetrics.duration}</strong>
              </div>
              <em>{selectedRoute.routeMetrics.distance}</em>
            </div>

            <div className="tracking-passenger-row">
              {passengerAvatar ? <img src={passengerAvatar} alt={passengerName} /> : <span>👤</span>}
              <div>
                <strong>{passengerName}</strong>
                <small>{selectedRoute.pickup.name}で待機中</small>
                <em>{passengerPhone}</em>
              </div>
            </div>

            <div className="tracking-actions">
              <Link className="tracking-call" to={getChatPath('customer')}>💬 連絡する</Link>
              <Link className="tracking-message" to="/driver-invoice">📄 請求書へ</Link>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
