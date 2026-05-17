import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  cancelFallbackRide,
  cancelRideByDriver,
  getFallbackRide,
  getCurrentRideForDriver,
} from '../api/rides.js';
import '../styles/app-pages.css';

export default function DriverRideStatusPage() {
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [statusText, setStatusText] = useState('乗車情報を読み込み中です...');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRide() {
      try {
        const data = await getCurrentRideForDriver();
        if (!isMounted) return;

        if (!data) {
          const fallbackRide = getFallbackRide();
          if (fallbackRide?.status === 'ongoing') {
            setRide(fallbackRide);
            setStatusText('');
            return;
          }

          setStatusText('現在対応中の乗車はありません。');
          return;
        }

        setRide(data);
        setStatusText(data.status === 'cancelled' ? '乗車はキャンセルされました。' : '');
      } catch {
        if (!isMounted) return;

        const fallbackRide = getFallbackRide();
        if (fallbackRide?.status === 'ongoing') {
          setRide(fallbackRide);
          setStatusText('');
          return;
        }

        setStatusText('乗車情報を読み込めません。');
      }
    }

    loadRide();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCancelRide() {
    if (!ride || isCancelling) return;

    setIsCancelling(true);
    try {
      await cancelRideByDriver(ride.tripId);
    } catch {
      cancelFallbackRide();
    } finally {
      navigate('/driver-home', {
        replace: true,
        state: { cancelledMessage: '乗車をキャンセルしました。' },
      });
    }
  }

  const passengerName = ride?.passenger?.name || 'お客様';
  const passengerPhone = ride?.passenger?.phone || '確認中';

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
          <span className="tracking-user-marker">📍</span>
          <span className="tracking-car-marker">🚕</span>

          <section className="driver-tracking-card">
            <div className="tracking-eta-header">
              <div>
                <span>到着予定時間</span>
                <strong>{ride ? 'あと3分' : '読み込み中'}</strong>
              </div>
              <em>{ride ? `${ride.trip.distanceKm} km` : '--'}</em>
            </div>

            {statusText ? (
              <div className="tracking-status-note" role="status">{statusText}</div>
            ) : (
              <>
                <div className="tracking-passenger-row">
                  <span>👤</span>
                  <div>
                    <strong>{passengerName}</strong>
                    <small>{ride.route.pickupAddress}</small>
                    <em>{passengerPhone}</em>
                  </div>
                </div>

                <div className="tracking-route-note">
                  <strong>{ride.route.pickupAddress}</strong>
                  <span>{ride.route.dropoffAddress}</span>
                </div>

                <div className="tracking-actions">
                  <Link className="tracking-call" to="/messages/customer">📞 連絡する</Link>
                  <Link className="tracking-message" to="/driver-invoice">📄 請求書へ</Link>
                </div>
                <button
                  className="tracking-cancel"
                  type="button"
                  onClick={handleCancelRide}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'キャンセル中...' : '乗車をキャンセル'}
                </button>
              </>
            )}
          </section>
        </section>
      </main>
    </PageShell>
  );
}
