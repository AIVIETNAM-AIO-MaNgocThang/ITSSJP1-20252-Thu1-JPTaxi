import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { acceptDriverRide, getPendingDriverRide, updateDriverLocation } from '../api/rides.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

function formatDistance(value) {
  const distance = Number(value);
  if (!Number.isFinite(distance)) return '2km以内';
  return `${distance.toFixed(1)} km`;
}

const defaultDriverLocation = {
  lat: 21.02878,
  lng: 105.85204,
};

function isNearTestDriver() {
  return (localStorage.getItem('jpTaxiDriverEmail') || localStorage.getItem('jpTaxiUserEmail') || '').toLowerCase() === 'neardriver@jptaxi.dev';
}

function getDriverLocation() {
  if (isNearTestDriver()) {
    return Promise.resolve(defaultDriverLocation);
  }

  if (!navigator.geolocation) {
    return Promise.resolve(defaultDriverLocation);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }),
      () => resolve(defaultDriverLocation),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 7000 },
    );
  });
}

function buildSelectedRoute(request) {
  return {
    destination: {
      name: request.dropoffAddress,
      address: request.dropoffAddress,
      position: [request.dropoffLat, request.dropoffLng],
    },
    pickup: {
      name: request.pickupAddress,
      position: [request.pickupLat, request.pickupLng],
    },
    routeMetrics: {
      duration: '計算中',
      distance: formatDistance(request.distanceKm),
      fare: '自動計算',
    },
    routePath: [
      [request.pickupLat, request.pickupLng],
      [request.dropoffLat, request.dropoffLng],
    ],
    passenger: {
      name: request.actualPassengerName || request.customer?.name || `KH-${request.customerId}`,
      phone: request.actualPassengerPhone || request.customer?.phone || '',
    },
  };
}

export default function DriverDispatchPage() {
  const navigate = useNavigate();
  const [pendingRide, setPendingRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(defaultDriverLocation);
  const [message, setMessage] = useState('半径2km以内の配車リクエストを検索しています...');
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function refreshDriverLocation() {
      try {
        const location = await getDriverLocation();
        if (!ignore) {
          setDriverLocation(location);
          await updateDriverLocation(location);
        }
        return location;
      } catch {
        /* pending ride polling still works with the latest saved location */
        return defaultDriverLocation;
      }
    }

    async function loadPendingRide() {
      try {
        const result = await getPendingDriverRide();
        if (ignore) return;
        setPendingRide(result?.request ?? null);
        setMessage(result?.request ? '' : (result?.message || '半径2km以内の配車リクエストを検索しています...'));
      } catch (error) {
        if (!ignore) {
          setPendingRide(null);
          setMessage(error.message || '条件に合う配車リクエストはまだありません。');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    refreshDriverLocation().finally(loadPendingRide);
    const locationTimer = window.setInterval(refreshDriverLocation, 30000);
    const timer = window.setInterval(loadPendingRide, 2500);
    return () => {
      ignore = true;
      window.clearInterval(locationTimer);
      window.clearInterval(timer);
    };
  }, []);

  const passengerName = useMemo(() => {
    if (!pendingRide) return '';
    return pendingRide.actualPassengerName || pendingRide.customer?.name || `KH-${pendingRide.customerId}`;
  }, [pendingRide]);
  const passengerPhone = pendingRide?.actualPassengerPhone || pendingRide?.customer?.phone || '';
  const routePoints = pendingRide ? [
    {
      key: 'driver',
      label: 'ドライバー位置',
      meta: '現在',
      position: [driverLocation.lat, driverLocation.lng],
      type: 'driver',
    },
    {
      key: 'pickup',
      label: pendingRide.pickupAddress,
      meta: '乗車地',
      position: [pendingRide.pickupLat, pendingRide.pickupLng],
      type: 'pickup',
    },
    {
      key: 'destination',
      label: pendingRide.dropoffAddress,
      meta: '目的地',
      position: [pendingRide.dropoffLat, pendingRide.dropoffLng],
      type: 'destination',
    },
  ] : [];
  const mapCenter = pendingRide
    ? [pendingRide.pickupLat, pendingRide.pickupLng]
    : [driverLocation.lat, driverLocation.lng];
  const routePath = pendingRide
    ? [
        [pendingRide.pickupLat, pendingRide.pickupLng],
        [pendingRide.dropoffLat, pendingRide.dropoffLng],
      ]
    : [];

  async function handleAccept() {
    if (!pendingRide || isAccepting) return;
    setIsAccepting(true);
    try {
      const result = await acceptDriverRide(pendingRide.requestId);
      sessionStorage.setItem('jpTaxiRideRequestId', String(pendingRide.requestId));
      if (result?.tripId) {
        sessionStorage.setItem('jpTaxiTripId', String(result.tripId));
      }
      sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify(buildSelectedRoute(pendingRide)));
      localStorage.setItem('jpTaxiRideAccepted', JSON.stringify({
        requestId: pendingRide.requestId,
        tripId: result?.tripId,
        acceptedAt: Date.now(),
      }));
      navigate('/driver-ride-status');
    } catch (error) {
      setMessage(error.message || 'この配車リクエストを承認できませんでした。');
      setPendingRide(null);
      setIsAccepting(false);
    }
  }

  return (
    <PageShell>
      <main className="driver-dispatch-screen">
        <Topbar
          brandTo="/driver-home"
          actions={(
            <>
              <Link to="/driver-home">ホーム</Link>
              <Link to="/messages/customer">通知</Link>
              <img className="topbar-avatar driver-avatar-top" src="https://i.pravatar.cc/150?u=driver_tanaka" alt="" />
            </>
          )}
        />

        <section className="driver-dispatch-main">
          <div className="driver-dispatch-left">
            <h1>配車リクエスト確認</h1>
            <p>半径2km以内で実際に予約中のお客様だけを表示します。</p>

            <div className="dispatch-driver-box">
              <img src="https://i.pravatar.cc/150?u=driver_tanaka" alt="" />
              <div>
                <strong>ドライバーはオンラインです</strong>
                <span>受付範囲: 2 km</span>
              </div>
            </div>

            {pendingRide ? (
              <>
                <section className="dispatch-card">
                  <div className="dispatch-countdown">2km</div>
                  <span>お迎え地点まで</span>
                  <strong>{formatDistance(pendingRide.distanceKm)}</strong>
                  <div className="dispatch-actions">
                    <Link className="dispatch-decline" to="/driver-home">スキップ</Link>
                    <button className="dispatch-accept" type="button" onClick={handleAccept} disabled={isAccepting}>
                      {isAccepting ? '承認中...' : '承認する'}
                    </button>
                  </div>
                </section>

                <section className="dispatch-customer-card">
                  <p>お客様情報</p>
                  <div>
                    <span>
                      <strong>{passengerName}</strong>
                      <em>{passengerPhone || '電話番号未登録'}</em>
                    </span>
                  </div>
                </section>
              </>
            ) : (
              <section className="dispatch-empty-card">
                <div className="spinner" aria-hidden="true"></div>
                <h2>{isLoading ? '読み込み中...' : '配車リクエストを検索中'}</h2>
                <p>{message}</p>
              </section>
            )}
          </div>

          <div className="driver-dispatch-map">
            <InteractiveRouteMap
              alternateRoutePath={[]}
              className="dispatch-route-map"
              currentLocation={[driverLocation.lat, driverLocation.lng]}
              fitToRoute={Boolean(pendingRide)}
              interactive
              mapCenter={mapCenter}
              mapZoom={15}
              route={routePoints}
              routePath={routePath}
              routeSummary={pendingRide ? `${formatDistance(pendingRide.distanceKm)} - 2 km` : null}
              scrollWheelZoom
              showControls
              showCurrentLocation={!pendingRide}
              showDetails={false}
              showDriver={false}
              showMarkers={Boolean(pendingRide)}
              showRoute={Boolean(pendingRide)}
            />
            {pendingRide ? (
              <>
                <span className="dispatch-map-label pickup">{pendingRide.pickupAddress}</span>
                <span className="dispatch-map-label drop">{pendingRide.dropoffAddress}</span>
                <section className="dispatch-floating-details">
                  <div className="dispatch-passenger-row">
                    <span>KH</span>
                    <div>
                      <strong>お客様: {passengerName}</strong>
                      <small>{passengerPhone || '連絡先を確認中'}</small>
                    </div>
                  </div>
                  <div className="dispatch-stats">
                    <article><span>お迎え</span><strong>{formatDistance(pendingRide.distanceKm)}</strong></article>
                    <article><span>範囲</span><strong>2 km</strong></article>
                    <article><span>状態</span><strong>新規</strong></article>
                  </div>
                </section>
              </>
            ) : (
              <section className="dispatch-floating-details dispatch-waiting-details">
                <div className="dispatch-passenger-row">
                  <span>...</span>
                  <div>
                    <strong>近くのお客様を検索しています</strong>
                    <small>予約リクエストがない場合、サンプルデータは表示しません。</small>
                  </div>
                </div>
              </section>
            )}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
