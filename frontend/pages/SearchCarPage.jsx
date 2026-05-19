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

export default function SearchCarPage() {
  const [userLocation, setUserLocation] = useState(defaultUserLocation);
  const [drivers, setDrivers] = useState(fallbackDrivers);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);

  useEffect(() => {
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
  }, []);

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
            fitToRoute={false}
            interactive
            currentLocation={mapCenter}
            mapCenter={mapCenter}
            mapZoom={15}
            nearbyDrivers={drivers}
            scrollWheelZoom
            showControls
            showCurrentLocation
            showDetails={false}
            showDriver={false}
            showMarkers={false}
            showRoute={false}
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
              <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/home">
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
