import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getActiveRide, processRidePayment } from '../api/rides.js';
import PageShell from '../components/PageShell.jsx';
import { clearCompletedRideBookingState } from '../utils/activeRideNavigation.js';
import { setLastInvoiceTripId } from '../utils/invoiceSession.js';
import '../styles/app-pages.css';

function readPaymentRequestTripId() {
  try {
    const paymentRequest = JSON.parse(localStorage.getItem('jpTaxiPaymentRequested') || 'null');
    return Number(paymentRequest?.tripId) || null;
  } catch {
    return null;
  }
}

function readStoredTripId() {
  return Number(sessionStorage.getItem('jpTaxiTripId') || readPaymentRequestTripId());
}

function isAlreadyClosedPaymentError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('đã hủy')
    || message.includes('da huy')
    || message.includes('cancel')
    || message.includes('completed')
    || message.includes('đã được thanh toán')
    || message.includes('da duoc thanh toan');
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Đang xác nhận thanh toán...');
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    let ignored = false;

    async function completePayment() {
      let tripId = readStoredTripId();

      try {
        const activeRide = await getActiveRide();
        if (ignored) return;
        if (activeRide?.type === 'trip' && activeRide.data?.tripId) {
          tripId = Number(activeRide.data.tripId);
          sessionStorage.setItem('jpTaxiTripId', String(tripId));
          setLastInvoiceTripId(tripId);
        }
      } catch {
        /* Stored trip id is enough for the payment request. */
      }

      if (!Number.isFinite(tripId) || tripId <= 0) {
        if (!ignored) {
          setStatus('Không tìm thấy chuyến đi cần thanh toán.');
          setCanGoBack(true);
        }
        return;
      }

      setLastInvoiceTripId(tripId);

      try {
        await processRidePayment({
          tripId,
          paymentMethod: 'VISA',
          password: 'password123',
        });
      } catch (error) {
        if (!isAlreadyClosedPaymentError(error)) {
          if (!ignored) {
            setStatus(error.message || 'Không thể xác nhận thanh toán.');
            setCanGoBack(true);
          }
          return;
        }
      }

      if (ignored) return;
      clearCompletedRideBookingState();
      navigate(`/driver-review?tripId=${tripId}`, { replace: true });
    }

    completePayment();

    return () => {
      ignored = true;
    };
  }, [navigate]);

  return (
    <PageShell withFooter={false}>
      <main className="payment-processing-screen">
        <section className="payment-processing-card">
          <h1>{status}</h1>
          {canGoBack ? <Link to="/ride-status">Quay lại chuyến đi</Link> : null}
        </section>
      </main>
    </PageShell>
  );
}
