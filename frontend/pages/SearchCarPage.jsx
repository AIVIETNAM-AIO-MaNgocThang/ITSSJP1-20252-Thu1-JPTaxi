import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { getRideRequest, updateRideRequestStatus } from '../api/rides.js';
import { getActiveRequestId, clearActiveRide } from '../utils/bookingSession.js';
import '../styles/search-car.css';

const STATUS_LABELS = {
  searching: 'タクシーを呼び出し中',
  assigned: 'ドライバーが見つかりました',
  failed: '配車に失敗しました',
  completed: '乗車完了',
  pending: '予約待ち',
};

export default function SearchCarPage() {
  const navigate = useNavigate();
  const requestId = getActiveRequestId();
  const [ride, setRide] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!requestId) {
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const data = await getRideRequest(requestId);
        if (cancelled) return;
        setRide(data);
        if (data.status === 'assigned') {
          navigate('/ride-status', { replace: true });
        }
      } catch {
        if (!cancelled) {
          setRide(null);
        }
      }
    }

    poll();
    const timer = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [requestId, navigate]);

  async function cancelSearch() {
    if (!requestId) {
      navigate('/home');
      return;
    }
    setCancelling(true);
    try {
      await updateRideRequestStatus(requestId, 'failed');
      clearActiveRide();
      navigate('/home');
    } catch {
      navigate('/home');
    } finally {
      setCancelling(false);
    }
  }

  const status = ride?.status ?? 'searching';
  const pendingCount = ride?.pending_dispatch_count ?? 0;
  const title = STATUS_LABELS[status] || STATUS_LABELS.searching;

  return (
    <PageShell>
      <main className="search-screen">
        <Topbar>
          <div className="location-chip" aria-label="現在位置">
            <span className="location-dot"></span>
            <span>{ride?.pickup_address || '配車中'}</span>
          </div>
        </Topbar>

        <section className="map-stage" aria-label="配車マップ">
          <div className="taxi-live taxi-one" aria-hidden="true">🚖</div>
          <div className="taxi-live taxi-two" aria-hidden="true">🚖</div>
          <div className="taxi-live taxi-three" aria-hidden="true">🚖</div>

          <div className="radar-center" aria-hidden="true">
            <div className="pulse"></div>
            <div className="pulse"></div>
            <div className="pulse"></div>
            <div className="user-pin"><span>📍</span></div>
          </div>

          <section className="status-card" aria-labelledby="search-title">
            <div className="status-info">
              <div className="spinner" aria-hidden="true"></div>
              <div className="text-group">
                <h1 id="search-title">{title}</h1>
                <p>
                  {requestId ? (
                    <>
                      予約 #{requestId} — 近くに <strong>{pendingCount || '—'}台</strong> の候補に通知しました。ドライバーの応答を待っています。
                    </>
                  ) : (
                    '予約情報がありません。ホームから再度お試しください。'
                  )}
                </p>
              </div>
            </div>

            <div className="card-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={cancelSearch}
                disabled={cancelling}
              >
                {cancelling ? 'キャンセル中…' : 'キャンセル'}
              </button>
              <Link
                className="submit-button"
                style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}
                to="/ride-status"
              >
                ドライバー確認へ
              </Link>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
