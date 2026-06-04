import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getActiveRide, processRidePayment } from '../api/rides.js';
import PageShell from '../components/PageShell.jsx';
import { clearCompletedRideBookingState } from '../utils/activeRideNavigation.js';
import { calculateTripFareBreakdown, formatYen } from '../utils/fare.js';
import { setLastInvoiceTripId } from '../utils/invoiceSession.js';
import '../styles/app-pages.css';

const PAYMENT_METHODS = ['クレジットカード (**** 4821)', '現金', 'PayPay', 'Apple Pay'];

const paymentMethodMap = {
  'クレジットカード (**** 4821)': 'VISA',
  '現金': 'VISA',
  PayPay: 'VNPAY',
  'Apple Pay': 'VISA',
};

function readStoredRoute() {
  try {
    return JSON.parse(sessionStorage.getItem('jpTaxiSelectedRoute') || 'null');
  } catch {
    return null;
  }
}

function readPaymentRequestTripId() {
  try {
    const paymentRequest = JSON.parse(localStorage.getItem('jpTaxiPaymentRequested') || 'null');
    return Number(paymentRequest?.tripId) || null;
  } catch {
    return null;
  }
}

function getStoredTripId(trip) {
  return Number(trip?.tripId || sessionStorage.getItem('jpTaxiTripId') || readPaymentRequestTripId());
}

function getTripDistance(trip, route) {
  return trip?.actualDistanceKm
    ?? trip?.distanceKm
    ?? route?.routeMetrics?.distance
    ?? 0;
}

function buildRouteFromTrip(trip) {
  const request = trip?.rideRequest;
  if (!request) return null;

  const distance = getTripDistance(trip, null);
  return {
    pickup: {
      name: request.pickupAddress || 'Điểm đón',
      position: [Number(request.pickupLat), Number(request.pickupLng)],
    },
    destination: {
      name: request.dropoffAddress || 'Điểm đến',
      address: request.dropoffAddress || '',
      position: [Number(request.dropoffLat), Number(request.dropoffLng)],
    },
    routeMetrics: {
      distance: Number(distance) ? `${Number(distance).toFixed(1)} km` : '-- km',
      fare: trip?.finalFareJpy ? formatYen(trip.finalFareJpy) : '',
    },
  };
}

function persistTripContext(trip) {
  if (!trip?.tripId) return;

  sessionStorage.setItem('jpTaxiTripId', String(trip.tripId));
  setLastInvoiceTripId(trip.tripId);

  if (!readStoredRoute()) {
    const route = buildRouteFromTrip(trip);
    if (route) sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify(route));
  }
}

function formatRideTime(value, suffix) {
  if (!value) return `-- ${suffix}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `-- ${suffix}`;
  return `${date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} ${suffix}`;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [methodOpen, setMethodOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [trip, setTrip] = useState(null);
  const [route, setRoute] = useState(() => readStoredRoute());

  const backPath =
    searchParams.get('from') === 'driver' || localStorage.getItem('jpTaxiRole') === 'driver'
      ? '/driver-ride-status'
      : '/ride-status';
  const currentRoute = route || buildRouteFromTrip(trip);
  const fare = calculateTripFareBreakdown(trip, getTripDistance(trip, currentRoute));
  const paymentTripId = getStoredTripId(trip);
  const hasPaymentContext = Number.isFinite(paymentTripId) && paymentTripId > 0 && Boolean(currentRoute || trip);
  const pickupName = currentRoute?.pickup?.name || trip?.rideRequest?.pickupAddress || 'Điểm đón';
  const destinationName = currentRoute?.destination?.name || trip?.rideRequest?.dropoffAddress || 'Điểm đến';

  useEffect(() => {
    let ignored = false;

    getActiveRide()
      .then((activeRide) => {
        if (ignored || activeRide?.type !== 'trip') return;

        setTrip(activeRide.data);
        persistTripContext(activeRide.data);

        const storedRoute = readStoredRoute();
        setRoute(storedRoute || buildRouteFromTrip(activeRide.data));
      })
      .catch(() => {
        if (!ignored) setRoute(readStoredRoute());
      });

    return () => {
      ignored = true;
    };
  }, []);

  function clearActiveRideState() {
    clearCompletedRideBookingState();
  }

  async function confirmPayment() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStatus('');
    setMethodOpen(false);

    let paymentTrip = trip;
    let tripId = getStoredTripId(paymentTrip);

    if ((!Number.isFinite(tripId) || tripId <= 0) && backPath !== '/driver-ride-status') {
      try {
        const activeRide = await getActiveRide();
        if (activeRide?.type === 'trip') {
          paymentTrip = activeRide.data;
          setTrip(activeRide.data);
          persistTripContext(activeRide.data);
          tripId = Number(activeRide.data?.tripId);
        }
      } catch {
        /* The explicit validation below handles the missing trip. */
      }
    }

    if (!Number.isFinite(tripId) || tripId <= 0) {
      setStatus('Chưa tìm thấy chuyến đi để xác nhận thanh toán.');
      setIsSubmitting(false);
      return;
    }

    setLastInvoiceTripId(tripId);

    if (backPath !== '/driver-ride-status') {
      try {
        await processRidePayment({
          tripId,
          paymentMethod: paymentMethodMap[method] || 'VISA',
          password: 'password123',
        });
      } catch (error) {
        setStatus(error.message || 'Không thể xác nhận thanh toán.');
        setIsSubmitting(false);
        return;
      }
    }

    clearActiveRideState();
    navigate(backPath === '/driver-ride-status' ? '/driver-ride-status' : `/driver-review?tripId=${tripId}`);
  }

  return (
    <PageShell withFooter={false}>
      <main className="payment-complete-screen">
        <section className="receipt-card">
          <header className="receipt-header">
            <span>Arrived Safely</span>
            <h1>目的地に到着</h1>
            <p>乗車記録と料金の確認</p>
          </header>

          <div className="receipt-body">
            <section className="receipt-route">
              <div>
                <span className="route-dot green"></span>
                <div><strong>{pickupName}</strong><small>{formatRideTime(trip?.startTime, '出発')}</small></div>
              </div>
              <div>
                <span className="route-dot dark"></span>
                <div><strong>{destinationName}</strong><small>{formatRideTime(trip?.endTime, '到着')}</small></div>
              </div>
            </section>

            <section className="receipt-billing">
              <div><span>基本運賃</span><strong>{formatYen(fare.baseFareJpy)}</strong></div>
              <div><span>距離加算 ({fare.distanceKm.toFixed(1)} km)</span><strong>{formatYen(fare.distanceFareJpy)}</strong></div>
              <div><span>予約手数料</span><strong>{formatYen(fare.reservationFeeJpy)}</strong></div>
              <div className="receipt-total"><span>お支払い合計</span><strong>{formatYen(fare.totalJpy)}</strong></div>
            </section>

            <section className="payment-preview">
              <div><span>💳</span><strong>{method}</strong></div>
              <button type="button" onClick={() => setMethodOpen(true)}>変更 〉</button>
            </section>

            <div className="receipt-actions">
              <Link className="payment-back-link" to={backPath}>戻る</Link>
              <button className="pay-confirm" type="button" onClick={confirmPayment} disabled={isSubmitting || !hasPaymentContext}>
                {isSubmitting ? '処理中...' : 'お支払いを確定する'}
              </button>
              <Link className="invoice-link" to="/invoice"><span>📄</span> 領収書を発行する</Link>
              <Link className="support-link" to="/messages/driver">お問い合わせはこちら</Link>
            </div>
            {!hasPaymentContext ? <p className="payment-status-text">Chưa có chuyến đi cần thanh toán.</p> : null}
            {status ? <p className="payment-status-text">{status}</p> : null}
          </div>
        </section>

        <div className={`payment-method-backdrop ${methodOpen ? 'open' : ''}`} onClick={() => setMethodOpen(false)}>
          <section className="payment-method-modal" role="dialog" aria-modal="true" aria-labelledby="payment-method-title" onClick={(event) => event.stopPropagation()}>
            <header>
              <h2 id="payment-method-title">支払い方法を選択</h2>
              <button type="button" aria-label="閉じる" onClick={() => setMethodOpen(false)}>×</button>
            </header>
            <div className="payment-method-list">
              {PAYMENT_METHODS.map((item) => (
                <button className={method === item ? 'selected' : ''} type="button" key={item} onClick={() => setMethod(item)}>
                  <span>{item === '現金' ? '💵' : '💳'}</span>
                  <strong>{item}</strong>
                  <em>{method === item ? '選択中' : '選択'}</em>
                </button>
              ))}
            </div>
            <button className="payment-method-confirm" type="button" onClick={() => setMethodOpen(false)}>この方法にする</button>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
