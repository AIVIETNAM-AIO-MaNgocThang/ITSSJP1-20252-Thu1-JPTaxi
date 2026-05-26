import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  acceptDispatch,
  getPendingDispatch,
  rejectDispatch,
} from '../api/rides.js';
import { ApiError } from '../api/client.js';
import { setActiveRequestId } from '../utils/bookingSession.js';
import '../styles/app-pages.css';

function formatVnd(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN').format(amount);
}

export default function DriverDispatchPage() {
  const navigate = useNavigate();
  const [dispatch, setDispatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getPendingDispatch();
        if (!cancelled) {
          setDispatch(data);
          setCountdown(30);
        }
      } catch {
        if (!cancelled) setDispatch(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!dispatch) return undefined;
    const tick = window.setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [dispatch?.dispatch_id]);

  async function handleAccept() {
    if (!dispatch?.dispatch_id) return;
    setActing(true);
    setError('');
    try {
      const result = await acceptDispatch(dispatch.dispatch_id);
      if (result.request_id) {
        setActiveRequestId(result.request_id);
      }
      navigate('/driver-ride-status');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '承認に失敗しました');
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!dispatch?.dispatch_id) {
      navigate('/driver-home');
      return;
    }
    setActing(true);
    setError('');
    try {
      await rejectDispatch(dispatch.dispatch_id);
      navigate('/driver-home');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '拒否に失敗しました');
    } finally {
      setActing(false);
    }
  }

  const customer = dispatch?.customer;
  const customerName = customer
    ? `${customer.last_name} ${customer.first_name} 様`
    : 'お客様';
  const fare = dispatch?.estimate?.total_price;

  if (loading) {
    return (
      <PageShell>
        <main className="driver-dispatch-screen">
          <p style={{ padding: 24 }}>読み込み中…</p>
        </main>
      </PageShell>
    );
  }

  if (!dispatch) {
    return (
      <PageShell>
        <main className="driver-dispatch-screen">
          <section style={{ padding: 24 }}>
            <h1>配車リクエスト</h1>
            <p>現在、新しい乗車依頼はありません。</p>
            <Link to="/driver-home">ホームに戻る</Link>
          </section>
        </main>
      </PageShell>
    );
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
            <h1>配車リクエスト</h1>
            <p>新しい乗車依頼内容を確認してください。</p>

            <section className="dispatch-card">
              <DispatchCountdown value={countdown} />
              <span>推定収益</span>
              <strong>{formatVnd(fare)} ₫</strong>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="dispatch-actions">
                <button
                  className="dispatch-decline"
                  type="button"
                  onClick={handleReject}
                  disabled={acting}
                >
                  拒否
                </button>
                <button
                  className="dispatch-accept"
                  type="button"
                  onClick={handleAccept}
                  disabled={acting}
                >
                  {acting ? '処理中…' : '承認する'}
                </button>
              </div>
            </section>

            <section className="dispatch-customer-card">
              <p>お客様情報 (Khách hàng)</p>
              <div>
                <span>
                  <strong>{customerName}</strong>
                  {customer?.phone && <em>📞 {customer.phone}</em>}
                </span>
                <Link to="/messages/customer">通話する</Link>
              </div>
            </section>
          </div>

          <div className="driver-dispatch-map">
            <span className="dispatch-map-label pickup">{dispatch.pickup_address} (乗車)</span>
            <span className="dispatch-map-label drop">{dispatch.dropoff_address} (降車)</span>
            <section className="dispatch-floating-details">
              <DispatchPassengerRow customer={customer} customerName={customerName} />
              <div className="dispatch-stats">
                <article>
                  <span>走行距離</span>
                  <strong>{dispatch.estimate?.distance_km ?? '—'}km</strong>
                </article>
                <article>
                  <span>移動時間</span>
                  <strong>{dispatch.estimate?.estimated_time_minutes ?? '—'}分</strong>
                </article>
                <article>
                  <span>車種</span>
                  <strong>{dispatch.vehicle_type}席</strong>
                </article>
              </div>
            </section>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function DispatchCountdown({ value }) {
  return <div className="dispatch-countdown">{value}s</div>;
}

function DispatchPassengerRow({ customer, customerName }) {
  return (
    <div className="dispatch-passenger-row">
      <span>👤</span>
      <div>
        <strong>乗客: {customerName}</strong>
        {customer?.phone && <small>📞 {customer.phone}</small>}
      </div>
    </div>
  );
}
