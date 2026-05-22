import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cancelDriverRide, requestDriverPayment } from '../api/rides.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
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
  passenger: null,
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

export default function DriverRideStatusPage() {
  const navigate = useNavigate();
  const [selectedRoute] = useState(readSelectedRoute);
  const [isCancellingRide, setIsCancellingRide] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const passenger = selectedRoute.passenger ?? {};
  const passengerName = passenger.name || 'お客様';
  const passengerPhone = passenger.phone || '連絡先を確認中';
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

  async function requestPayment() {
    const tripId = Number(sessionStorage.getItem('jpTaxiTripId'));
    if (!Number.isFinite(tripId) || tripId <= 0) {
      navigate('/xacnhancuocxe', { replace: true });
      return;
    }

    try {
      const result = await requestDriverPayment(tripId);
      localStorage.setItem('jpTaxiPaymentRequested', JSON.stringify({
        tripId,
        requestedAt: result?.requestedAt || Date.now(),
      }));
    } catch {
      localStorage.setItem('jpTaxiPaymentRequested', JSON.stringify({
        tripId,
        requestedAt: Date.now(),
      }));
    }
    navigate('/driver-invoice');
  }

  async function cancelRideByDriver() {
    if (isCancellingRide) return;

    const tripId = Number(sessionStorage.getItem('jpTaxiTripId'));
    if (!Number.isFinite(tripId) || tripId <= 0) {
      navigate('/xacnhancuocxe', { replace: true });
      return;
    }

    setIsCancellingRide(true);
    setCancelError('');

    try {
      await cancelDriverRide(tripId);
      sessionStorage.removeItem('jpTaxiRideRequestId');
      sessionStorage.removeItem('jpTaxiTripId');
      localStorage.removeItem('jpTaxiRideAccepted');
      localStorage.removeItem('jpTaxiPaymentRequested');
      navigate('/xacnhancuocxe', { replace: true });
    } catch (error) {
      setCancelError(error.message || '乗車をキャンセルできませんでした。');
      setIsCancellingRide(false);
    }
  }

  return (
    <PageShell>
      <main className="driver-tracking-screen">
        <Topbar
          brandTo="/driver-home"
          actions={(
            <>
              <Link to="/driver-home">ホーム</Link>
              <Link to="/messages/customer">メッセージ</Link>
              <Link to="/driver-info/basic">アカウント</Link>
            </>
          )}
        />

        <section className="driver-tracking-map">
          <InteractiveRouteMap
            alternateRoutePath={[]}
            className="tracking-route-map"
            compact
            currentLocation={selectedRoute.pickup.position}
            route={routePoints}
            routePath={selectedRoute.routePath}
            routeSummary={`${selectedRoute.routeMetrics.distance} - ${selectedRoute.routeMetrics.duration}`}
            scrollWheelZoom
            showCurrentLocation={false}
            showDetails={false}
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
              <span>人</span>
              <div>
                <strong>{passengerName} 様</strong>
                <small>{selectedRoute.pickup.name}で待機中</small>
                <em>{passengerPhone}</em>
              </div>
            </div>

            <div className="tracking-actions">
              <Link className="tracking-call" to="/messages/customer">連絡する</Link>
              <button className="tracking-message" type="button" onClick={requestPayment}>請求書を発行</button>
              <button className="tracking-cancel-ride" type="button" onClick={cancelRideByDriver} disabled={isCancellingRide}>
                {isCancellingRide ? 'キャンセル中...' : '乗車をキャンセル'}
              </button>
            </div>
            {cancelError ? <p className="tracking-error-text">{cancelError}</p> : null}
          </section>
        </section>
      </main>
    </PageShell>
  );
}
