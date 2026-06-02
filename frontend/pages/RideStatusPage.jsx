import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveRide } from '../api/rides.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getChatPath } from '../utils/chatSession.js';
import { fetchDrivingRoute, formatDistance, formatDuration } from '../utils/routePlanner.js';
import '../styles/app-pages.css';

const fallbackRoute = {
  destination: {
    name: 'ロッテホテル ハノイ',
    address: '54 Liễu Giai, Ba Đình, Hà Nội',
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
      routePath: Array.isArray(parsedRoute.routePath) ? parsedRoute.routePath : fallbackRoute.routePath,
      routeMetrics: {
        ...fallbackRoute.routeMetrics,
        ...parsedRoute.routeMetrics,
      },
    };
  } catch {
    return fallbackRoute;
  }
}

function parseDriverPosition(driver) {
  const latitude = Number(driver?.location?.latitude ?? driver?.latitude);
  const longitude = Number(driver?.location?.longitude ?? driver?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

export default function RideStatusPage() {
  const { t } = useLanguage();
  const [selectedRoute, setSelectedRoute] = useState(readSelectedRoute);
  const [driverPosition, setDriverPosition] = useState(() => parseDriverPosition(readSelectedRoute().driver) || null);

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
      .catch((error) => {
        if (error.name !== 'AbortError') {
          /* Keep the stored route when the routing service is unavailable. */
        }
      });

    return () => controller.abort();
  }, [selectedRoute.destination.position, selectedRoute.pickup.position]);

  useEffect(() => {
    let ignore = false;

    async function syncDriverPosition() {
      try {
        const activeRide = await getActiveRide();
        if (ignore) return;
        const nextDriverPosition = parseDriverPosition(activeRide?.data?.driver);
        if (!nextDriverPosition) return;

        setDriverPosition(nextDriverPosition);
        setSelectedRoute((current) => {
          const nextRoute = {
            ...current,
            driver: {
              ...(current.driver || {}),
              ...(activeRide.data.driver || {}),
            },
          };
          window.sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify(nextRoute));
          return nextRoute;
        });
      } catch {
        /* Keep the last known driver position when the active ride API is unavailable. */
      }
    }

    syncDriverPosition();
    const timer = window.setInterval(syncDriverPosition, 5000);

    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);
  const routePoints = [
    {
      key: 'pickup',
      label: selectedRoute.pickup.name,
      meta: t('pickupPoint'),
      time: t('now'),
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
      <main className="user-tracking-screen">
        <Topbar
          brandTo="/home"
          actions={(
            <>
              <Link to="/home">{t('navHome')}</Link>
              <Link to="/user-info/profile">{t('navAccount')}</Link>
              <img className="topbar-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" />
            </>
          )}
        />

        <section className="user-tracking-map">
          <InteractiveRouteMap
            alternateRoutePath={[]}
            className="tracking-route-map"
            compact
            currentLocation={selectedRoute.pickup.position}
            driverPosition={driverPosition || selectedRoute.pickup.position}
            route={routePoints}
            routePath={selectedRoute.routePath}
            routeSummary={`${selectedRoute.routeMetrics.distance} - ${selectedRoute.routeMetrics.duration}`}
            scrollWheelZoom
            showCurrentLocation={false}
            showDetails={false}
          />

          <section className="tracking-card">
            <div className="tracking-eta-header">
              <div>
                <span>{t('etaLabel')}</span>
                <strong>{t('remainingPrefix')} {selectedRoute.routeMetrics.duration}</strong>
              </div>
              <em>{selectedRoute.routeMetrics.distance}</em>
            </div>

            <div className="tracking-driver-row">
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" alt="" />
              <div>
                <strong>{t('driverName')}</strong>
                <small>{t('driverCar')}</small>
                <em>30A-123.45</em>
              </div>
            </div>

            <div className="tracking-actions">
              <Link className="tracking-message wide" to={getChatPath('driver')}>💬 {t('messageDriver')}</Link>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
