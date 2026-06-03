import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCustomerProfile, resolveAssetUrl } from '../api/accounts.js';
import { getActiveRide } from '../api/rides.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getChatPath } from '../utils/chatSession.js';
import { fetchDrivingRoute, formatDistance, formatDuration, hasDrivingRoutePath } from '../utils/routePlanner.js';
import '../styles/app-pages.css';

const customerFallbackAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';
const driverFallbackAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

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

function parseDriverPosition(driver) {
  const latitude = Number(driver?.location?.latitude ?? driver?.latitude);
  const longitude = Number(driver?.location?.longitude ?? driver?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

export default function RideStatusPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedRoute, setSelectedRoute] = useState(readSelectedRoute);
  const [driverPosition, setDriverPosition] = useState(() => parseDriverPosition(readSelectedRoute().driver) || null);
  const [topbarAvatar, setTopbarAvatar] = useState(() => (
    resolveAssetUrl(localStorage.getItem('jpTaxiCustomerAvatarUrl')) || customerFallbackAvatar
  ));

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

    function syncTopbarAvatar() {
      setTopbarAvatar(resolveAssetUrl(localStorage.getItem('jpTaxiCustomerAvatarUrl')) || customerFallbackAvatar);
    }

    syncTopbarAvatar();
    getCustomerProfile()
      .then((profile) => {
        if (ignore) return;
        const avatar = resolveAssetUrl(profile?.avatarUrl);
        if (avatar) {
          localStorage.setItem('jpTaxiCustomerAvatarUrl', avatar);
          setTopbarAvatar(avatar);
        }
      })
      .catch(() => {
        if (!ignore) syncTopbarAvatar();
      });
    window.addEventListener('storage', syncTopbarAvatar);
    window.addEventListener('focus', syncTopbarAvatar);

    return () => {
      ignore = true;
      window.removeEventListener('storage', syncTopbarAvatar);
      window.removeEventListener('focus', syncTopbarAvatar);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function syncDriverPosition() {
      try {
        const activeRide = await getActiveRide();
        if (ignore) return;
        const activeDriver = activeRide?.data?.driver;
        const activeVehicle = activeRide?.data?.vehicle;
        if (activeRide?.paymentRequested && activeRide?.data?.tripId) {
          localStorage.setItem('jpTaxiPaymentRequested', JSON.stringify({
            tripId: activeRide.data.tripId,
            requestedAt: Date.now(),
          }));
          sessionStorage.setItem('jpTaxiTripId', String(activeRide.data.tripId));
          navigate('/payment');
          return;
        }
        const nextDriverPosition = parseDriverPosition(activeRide?.data?.driver);
        if (!nextDriverPosition && !activeDriver && !activeVehicle) return;

        if (nextDriverPosition) {
          setDriverPosition(nextDriverPosition);
        }
        setSelectedRoute((current) => {
          const nextRoute = {
            ...current,
            driver: {
              ...(current.driver || {}),
              ...(activeDriver || {}),
            },
            vehicle: {
              ...(current.vehicle || {}),
              ...(activeVehicle || {}),
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
  }, [navigate]);
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
  const driver = selectedRoute.driver || {};
  const vehicle = selectedRoute.vehicle || {};
  const driverName = driver.name || t('driverName');
  const driverAvatar = resolveAssetUrl(driver.avatarUrl) || driverFallbackAvatar;
  const driverCar = [vehicle.brand, vehicle.color].filter(Boolean).join(' ') || t('driverCar');
  const licensePlate = vehicle.licensePlate || '30A-123.45';

  return (
    <PageShell>
      <main className="user-tracking-screen">
        <Topbar
          brandTo="/home"
          actions={(
            <>
              <Link to="/home">{t('navHome')}</Link>
              <Link to={getChatPath('driver')}>{t('navMessages')}</Link>
              <Link to="/user-info/profile">{t('navAccount')}</Link>
              <img className="topbar-avatar" src={topbarAvatar} alt="" />
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
            showRoute={hasDrivingRoutePath(selectedRoute.routePath)}
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
              <img src={driverAvatar} alt={driverName} />
              <div>
                <strong>{driverName}</strong>
                <small>{driverCar}</small>
                <em>{licensePlate}</em>
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
