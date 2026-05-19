import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/search-car.css';

const defaultUserLocation = {
  latitude: 21.02878,
  longitude: 105.85204,
};

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
      hasRoute: true,
      routePath: Array.isArray(parsedRoute.routePath) ? parsedRoute.routePath : fallbackSelectedRoute.routePath,
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
  const [selectedRoute] = useState(readSelectedRoute);
  const [userLocation, setUserLocation] = useState({
    latitude: selectedRoute.pickup.position[0],
    longitude: selectedRoute.pickup.position[1],
  });
  const [drivers, setDrivers] = useState(fallbackDrivers);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);

  useEffect(() => {
    if (selectedRoute.hasRoute) {
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setUserLocation(defaultUserLocation);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 7000 },
    );
  }, [selectedRoute.hasRoute]);

  useEffect(() => {
    let ignore = false;
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
  }, [userLocation.latitude, userLocation.longitude]);

  const mapCenter = useMemo(
    () => [userLocation.latitude, userLocation.longitude],
    [userLocation.latitude, userLocation.longitude],
  );
  const routePoints = useMemo(() => [
    {
      key: 'pickup',
      label: selectedRoute.pickup.name,
      meta: '出発地',
      time: '現在',
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
  ], [mapCenter, selectedRoute]);
  const driverCount = drivers.length;

  return (
    <PageShell>
      <main className="search-screen">
        <Topbar>
          <div className="location-chip" aria-label="現在位置">
            <span className="location-dot"></span>
            <span>ハノイ・ホアンキエム周辺</span>
          </div>
        </Topbar>

        <section className="map-stage" aria-label="配車マップ">
          <InteractiveRouteMap
            className="search-background-map"
            fitToRoute={selectedRoute.hasRoute}
            interactive
            alternateRoutePath={[]}
            currentLocation={mapCenter}
            mapCenter={mapCenter}
            mapZoom={15}
            nearbyDrivers={drivers}
            route={routePoints}
            routePath={selectedRoute.hasRoute ? selectedRoute.routePath : []}
            routeSummary={`${selectedRoute.routeMetrics.distance} - ${selectedRoute.routeMetrics.duration}`}
            scrollWheelZoom
            showControls
            showCurrentLocation={!selectedRoute.hasRoute}
            showDetails={false}
            showDriver={false}
            showMarkers={selectedRoute.hasRoute}
            showRoute={selectedRoute.hasRoute}
          />
          <section className="status-card" aria-labelledby="search-title">
            <div className="status-info">
              <div className="spinner" aria-hidden="true"></div>
              <div className="text-group">
                <h1 id="search-title">タクシーを呼び出し中</h1>
                <p>
                  {isLoadingDrivers ? (
                    '近くの車両を確認しています...'
                  ) : (
                    <>
                      近くに <strong>{driverCount}台</strong> の車両が見つかりました。ドライバーの応答を待っています。
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="card-actions">
              <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/bill-confirm">
                キャンセル
              </Link>
              <Link className="submit-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/ride-status">
                ドライバー確認へ
              </Link>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
