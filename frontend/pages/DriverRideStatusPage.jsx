import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resolveAssetUrl } from '../api/accounts.js';
import { getActiveDriverRide, updateDriverLocation } from '../api/rides.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { hasRecentAcceptedRide } from '../utils/activeRideNavigation.js';
import { getChatPath } from '../utils/chatSession.js';
import { DEFAULT_MAP_LOCATION, watchBrowserLocation } from '../utils/geolocation.js';
import { setLastInvoiceTripId } from '../utils/invoiceSession.js';
import { fetchDrivingRoute, formatDistance, formatDuration, hasDrivingRoutePath } from '../utils/routePlanner.js';
import '../styles/app-pages.css';

const driverFallbackAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

function createFallbackRoute(t) {
  return {
  destination: {
    name: t('lotteHotelHanoi'),
    address: '54 Lieu Giai, Ba Dinh, Ha Noi',
    position: [21.03205, 105.81283],
  },
  pickup: {
    name: t('hoanKiemLake'),
    position: [21.02878, 105.85204],
  },
  routeMetrics: {
    duration: `12${t('minuteUnit')}`,
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
}

function readSelectedRoute(t) {
  const fallbackRoute = createFallbackRoute(t);
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
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [selectedRoute, setSelectedRoute] = useState(() => readSelectedRoute(t));
  const [driverLocation, setDriverLocation] = useState(null);
  const [topbarAvatar, setTopbarAvatar] = useState(() => (
    resolveAssetUrl(localStorage.getItem('jpTaxiDriverAvatarUrl')) || driverFallbackAvatar
  ));
  const passenger = selectedRoute.passenger || {};
  const passengerName = passenger.name || 'JPTX-9821';
  const passengerPhone = passenger.phone || '090-1234-5678';
  const passengerAvatar = resolveAssetUrl(passenger.avatarUrl);
  const waitingStatus = language === 'vi'
    ? `${t('waitingAt')} ${selectedRoute.pickup.name}`
    : `${selectedRoute.pickup.name}${t('waitingAt')}`;

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
        if (ignore) return;
        if (activeRide?.type !== 'trip') {
          if (hasRecentAcceptedRide()) return;
          sessionStorage.removeItem('jpTaxiTripId');
          navigate('/driver-home', { replace: true });
          return;
        }
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
  }, [navigate]);

  const routePoints = [
    {
      key: 'pickup',
      label: selectedRoute.pickup.name,
      meta: t('pickupMeta'),
      time: t('now'),
      position: selectedRoute.pickup.position,
      type: 'pickup',
    },
    {
      key: 'destination',
      label: selectedRoute.destination.name,
      meta: selectedRoute.destination.address,
      time: `${t('remainingTime')} ${selectedRoute.routeMetrics.duration}`,
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
              <Link to="/driver-home">{t('navHome')}</Link>
              <Link to={getChatPath('customer')}>{t('navMessages')}</Link>
              <Link to="/driver-info/basic">{t('navAccount')}</Link>
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
            driverPosition={driverLocation}
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
                <span>{t('estimatedArrivalTime')}</span>
                <strong>{t('remainingTime')} {selectedRoute.routeMetrics.duration}</strong>
              </div>
              <em>{selectedRoute.routeMetrics.distance}</em>
            </div>

            <div className="tracking-passenger-row">
              {passengerAvatar ? <img src={passengerAvatar} alt={passengerName} /> : <span>👤</span>}
              <div>
                <strong>{passengerName}</strong>
                <small>{waitingStatus}</small>
                <em>{passengerPhone}</em>
                {!driverLocation ? <small>{t('enableLocation')}</small> : null}
              </div>
            </div>

            <div className="tracking-actions">
              <Link className="tracking-call" to={getChatPath('customer')}>💬 {t('contact')}</Link>
              <Link className="tracking-message" to="/driver-invoice">📄 {t('goToInvoice')}</Link>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
