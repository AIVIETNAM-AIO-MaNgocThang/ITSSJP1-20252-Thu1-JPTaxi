import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getTripInvoice } from '../api/invoices.js';
import { requestDriverPayment } from '../api/rides.js';
import InvoiceTemplate from '../components/InvoiceTemplate.jsx';
import PageShell from '../components/PageShell.jsx';
import {
  calculateTripFareBreakdown,
  JPY_TO_VND_RATE,
} from '../utils/fare.js';
import { getLastInvoiceTripId, setLastInvoiceTripId } from '../utils/invoiceSession.js';
import '../styles/app-pages.css';

function readStoredRoute() {
  try {
    return JSON.parse(sessionStorage.getItem('jpTaxiSelectedRoute') || 'null') || {};
  } catch {
    return {};
  }
}

function inclusiveVat(total) {
  return Math.round(Number(total || 0) - Number(total || 0) / 1.1);
}

function buildFallbackInvoice(tripId) {
  const route = readStoredRoute();
  const fare = calculateTripFareBreakdown(null, route.routeMetrics?.distance ?? 4.8);
  const vatJpy = inclusiveVat(fare.totalJpy);
  const vatVnd = inclusiveVat(fare.totalFareVnd);

  return {
    tripId,
    invoiceNumber: `JPT-${tripId || 'PREVIEW'}`,
    title: '電子領収書',
    seller: {
      legalNameJa: 'JP TAXI',
      taxCode: 'JP TAXI',
      addressJa: 'Hanoi, Vietnam',
    },
    trip: {
      pickupAddress: route.pickup?.name || '出発地',
      dropoffAddress: route.destination?.name || '目的地',
      distanceKm: fare.distanceKm,
      serviceTime: new Date().toISOString(),
    },
    payment: null,
    lineItems: [
      { code: 'BASE_FARE', labelJa: '基本運賃', amountJpy: fare.baseFareJpy },
      { code: 'DISTANCE_FARE', labelJa: `距離加算 (${fare.distanceKm.toFixed(1)} km)`, amountJpy: fare.distanceFareJpy },
      { code: 'SERVICE_FEE', labelJa: '予約手数料', amountJpy: fare.reservationFeeJpy },
    ],
    amounts: {
      jpy: {
        totalInclTax: fare.totalJpy,
        vatAmount: vatJpy,
        vatRatePercent: 10,
      },
      vnd: {
        totalInclTax: fare.totalFareVnd,
        vatAmount: vatVnd,
        vatRatePercent: 10,
      },
      exchangeRateVndToJpy: JPY_TO_VND_RATE,
    },
    qrPayload: `JPTAXI|${tripId || 'PREVIEW'}|${fare.totalJpy}|JPY`,
  };
}

export default function InvoicePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDriver = localStorage.getItem('jpTaxiRole') === 'driver' || location.pathname.startsWith('/driver');
  const closePath = isDriver ? '/driver-ride-status' : '/driver-review';
  const closeLabel = isDriver ? '閉じる' : 'ドライバー評価へ';
  const activeTripId = Number(sessionStorage.getItem('jpTaxiTripId')) || null;
  const tripId = isDriver
    ? activeTripId || getLastInvoiceTripId()
    : getLastInvoiceTripId() || activeTripId;
  const fallbackInvoice = useMemo(() => buildFallbackInvoice(tripId), [tripId]);
  const [invoice, setInvoice] = useState(null);
  const [status, setStatus] = useState('');
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const [paymentRequested, setPaymentRequested] = useState(false);
  const displayedInvoice = invoice || (!tripId ? fallbackInvoice : null);

  useEffect(() => {
    let ignored = false;
    if (!tripId) return undefined;
    setLastInvoiceTripId(tripId);
    getTripInvoice(tripId)
      .then((payload) => {
        if (!ignored) setInvoice(payload);
      })
      .catch((error) => {
        if (!ignored) setStatus(error.message || '領収書を取得できませんでした。');
      });
    return () => {
      ignored = true;
    };
  }, [tripId]);

  async function handleRequestPayment() {
    if (!isDriver || !tripId || isRequestingPayment) return;
    setIsRequestingPayment(true);
    setStatus('');

    try {
      const result = await requestDriverPayment(tripId);
      localStorage.setItem('jpTaxiPaymentRequested', JSON.stringify({
        tripId,
        requestedAt: result?.requestedAt || Date.now(),
      }));
      setStatus('支払い依頼を送信しました。お客様は支払い画面へ移動します。');
      setPaymentRequested(true);
    } catch (error) {
      setStatus(error.message || '支払い依頼を送信できませんでした。');
      setIsRequestingPayment(false);
    }
  }

  function handleCloseDriverTrip() {
    if (!isDriver) return;
    sessionStorage.removeItem('jpTaxiTripId');
    sessionStorage.removeItem('jpTaxiRideRequestId');
    sessionStorage.removeItem('jpTaxiSelectedRoute');
    localStorage.removeItem('jpTaxiPaymentRequested');
    localStorage.removeItem('jpTaxiRideAccepted');
    navigate('/driver-home', { replace: true });
  }

  return (
    <PageShell withFooter={false}>
      <main className="invoice-screen">
        <section className="zip-invoice-container">
          {displayedInvoice ? <InvoiceTemplate invoice={displayedInvoice} /> : <p className="invoice-loading">領収書を読み込んでいます...</p>}
          {status ? <p className="payment-status-text">{status}</p> : null}
          <div className="invoice-actions">
            <button type="button">📄 PDF保存</button>
            <button type="button">📧 メールで送信</button>
          </div>
          {isDriver && (
            <button
              className="invoice-close"
              disabled={!tripId || isRequestingPayment || paymentRequested}
              onClick={handleRequestPayment}
              type="button"
            >
              {isRequestingPayment ? '送信中...' : '支払いを依頼する'}
            </button>
          )}
          {isDriver && paymentRequested ? (
            <button className="invoice-close" type="button" onClick={handleCloseDriverTrip}>
              受領確認して閉じる
            </button>
          ) : null}
          <Link className="invoice-close" to={closePath}>{closeLabel}</Link>
        </section>
      </main>
    </PageShell>
  );
}
