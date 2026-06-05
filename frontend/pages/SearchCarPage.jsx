import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../api/accounts.js';
import { apiRequest } from '../api/client.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { hasDrivingRoutePath } from '../utils/routePlanner.js';
import '../styles/search-car.css';

const customerFallbackAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';

const fallbackSelectedRoute = {
  hasRoute: false,
  destination: {
    name: 'ロッテホテル ハノイ',
    address: '54 Liễu Giai, Ba Đình, Hà Nội',
    position: [21.03205, 105.81283],
  },
  pickup: {
    name: '現在位置',
    position: [21.02878, 105.85204],
  },
  routeMetrics: {
    duration: '12分',
    distance: '4.8 km',
    fare: '¥680',
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

const fallbackDrivers = [
  {
    driverId: 'demo-1',
    label: 'Taxi A',
    distanceKm: 0.8,
    position: [21.0312, 105.8483],
  },
  {
    driverId: 'demo-2',
    label: 'Taxi B',
    distanceKm: 1.4,
    position: [21.0246, 105.8581],
  },
  {
    driverId: 'demo-3',
    label: 'Taxi C',
    distanceKm: 2.1,
    position: [21.0341, 105.8569],
  },
];

function normalizeDriver(driver) {
  const latitude = Number(driver?.location?.latitude ?? driver?.latitude);
  const longitude = Number(driver?.location?.longitude ?? driver?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const vehicle = driver.vehicle ?? {};
  const label = [driver.lastName, driver.firstName].filter(Boolean).join(' ')
    || vehicle.licensePlate
    || 'Taxi';
  const distanceKm = Number(driver.distanceKm);

  return {
    driverId: driver.driverId,
    label,
    distanceKm: Number.isFinite(distanceKm) ? distanceKm : null,
    position: [latitude, longitude],
    vehicle,
  };
}

function readSelectedRoute() {
  try {
    const rawRoute = window.sessionStorage.getItem('jpTaxiSelectedRoute');
    if (!rawRoute) return fallbackSelectedRoute;

    const parsedRoute = JSON.parse(rawRoute);
    const pickupPosition = parsedRoute.pickup?.position;
    const destinationPosition = parsedRoute.destination?.position;

    if (!Array.isArray(pickupPosition) || !Array.isArray(destinationPosition)) {
      return fallbackSelectedRoute;
    }

    return {
      ...fallbackSelectedRoute,
      ...parsedRoute,
      hasRoute: hasDrivingRoutePath(parsedRoute.routePath),
      routePath: hasDrivingRoutePath(parsedRoute.routePath) ? parsedRoute.routePath : [],
      routeMetrics: {
        ...fallbackSelectedRoute.routeMetrics,
        ...parsedRoute.routeMetrics,
      },
    };
  } catch {
    return fallbackSelectedRoute;
  }
}

export default function SearchCarPage() {
  const { t } = useLanguage();
  const [topbarAvatar, setTopbarAvatar] = useState(() => (
    resolveAssetUrl(localStorage.getItem('jpTaxiCustomerAvatarUrl')) || customerFallbackAvatar
  ));
  const [selectedRoute] = useState(readSelectedRoute);
  const [userLocation, setUserLocation] = useState(() => (
    selectedRoute.hasRoute
      ? {
          latitude: selectedRoute.pickup.position[0],
          longitude: selectedRoute.pickup.position[1],
        }
      : null
  ));
  const [drivers, setDrivers] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [locationRequired, setLocationRequired] = useState(!selectedRoute.hasRoute);

  useEffect(() => {
    function syncTopbarAvatar() {
      setTopbarAvatar(resolveAssetUrl(localStorage.getItem('jpTaxiCustomerAvatarUrl')) || customerFallbackAvatar);
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
    if (selectedRoute.hasRoute) {
      setLocationRequired(false);
      return;
    }

    if (!navigator.geolocation) {
      setUserLocation(null);
      setDrivers([]);
      setIsLoadingDrivers(false);
      setLocationRequired(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationRequired(false);
      },
      () => {
        setUserLocation(null);
        setDrivers([]);
        setIsLoadingDrivers(false);
        setLocationRequired(true);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 7000 },
    );
  }, [selectedRoute.hasRoute]);

  useEffect(() => {
    let ignore = false;
    if (!userLocation) {
      setDrivers([]);
      setIsLoadingDrivers(false);
      return () => {
        ignore = true;
      };
    }

    const params = new URLSearchParams({
      lat: String(userLocation.latitude),
      lng: String(userLocation.longitude),
      radiusKm: '5',
      maxLocationAgeMinutes: '30',
      limit: '8',
      sort: 'distance',
    });

    setIsLoadingDrivers(true);
    apiRequest(`/drivers/search?${params.toString()}`)
      .then((data) => {
        if (ignore) return;
        const nextDrivers = (data?.drivers ?? []).map(normalizeDriver).filter(Boolean);
        setDrivers(nextDrivers.length > 0 ? nextDrivers : fallbackDrivers);
      })
      .catch(() => {
        if (!ignore) {
          setDrivers(fallbackDrivers);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingDrivers(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [userLocation]);

  const mapCenter = useMemo(
    () => (
      userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : selectedRoute.destination.position
    ),
    [selectedRoute.destination.position, userLocation],
  );
  const routePoints = useMemo(() => [
    {
      key: 'pickup',
      label: selectedRoute.pickup.name,
      meta: t('pickupPoint'),
      time: t('now'),
      position: mapCenter,
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
  ], [mapCenter, selectedRoute, t]);
  const driverCount = drivers.length;

  return (
    <PageShell>
      <main className="search-screen">
        <Topbar actions={(
          <>
            <Link to="/home">{t('navHome')}</Link>
            <Link to="/messages/driver">{t('navMessages')}</Link>
            <Link to="/user-info/profile">{t('navAccount')}</Link>
          <div className="location-chip" aria-label={t('currentLocation')} style={{ display: userLocation ? undefined : 'none' }}>
            <span className="location-dot"></span>
            <span>{t('currentLocation')}</span>
          </div>
            <img className="topbar-avatar" src={topbarAvatar} alt="" />
          </>
        )} />

        <section className="map-stage" aria-label="配車マップ">
          <InteractiveRouteMap
            className="search-background-map"
            fitToRoute={selectedRoute.hasRoute}
            interactive
            alternateRoutePath={[]}
            currentLocation={userLocation ? mapCenter : null}
            mapCenter={mapCenter}
            mapZoom={15}
            nearbyDrivers={drivers}
            route={userLocation || selectedRoute.hasRoute ? routePoints : []}
            routePath={selectedRoute.hasRoute ? selectedRoute.routePath : []}
            routeSummary={`${selectedRoute.routeMetrics.distance} - ${selectedRoute.routeMetrics.duration}`}
            scrollWheelZoom
            showControls
            showCurrentLocation={Boolean(userLocation && !selectedRoute.hasRoute)}
            showDetails={false}
            showDriver={false}
            showMarkers={Boolean(userLocation || selectedRoute.hasRoute)}
            showRoute={selectedRoute.hasRoute}
          />
          <section className="status-card" aria-labelledby="search-title">
            <div className="status-info">
              <div className="spinner" aria-hidden="true"></div>
              <div className="text-group">
                <h1 id="search-title">{t('searchingTaxi')}</h1>
                <p>
                  {locationRequired ? (
                    t('enableLocation')
                  ) : isLoadingDrivers ? (
                    t('checkingNearbyCars')
                  ) : (
                    <>
                      {t('nearbyCarsFoundPrefix')} <strong>{driverCount}</strong> {t('nearbyCarsFoundSuffix')}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="card-actions">
              <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/bill-confirm">
                {t('cancel')}
              </Link>
              <Link
                className={`submit-button ${locationRequired ? 'disabled' : ''}`}
                onClick={(event) => {
                  if (locationRequired) event.preventDefault();
                }}
                style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}
                to={locationRequired ? '#' : '/ride-status'}
              >
                {t('driverConfirm')}
              </Link>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
