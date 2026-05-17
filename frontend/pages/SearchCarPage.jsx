import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  cancelDemoSearch,
  getFallbackRide,
  getCurrentRideForCustomer,
  startDemoSearch,
} from '../api/rides.js';
import '../styles/search-car.css';

export default function SearchCarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchStatus, setSearchStatus] = useState('配車リクエストを送信しています...');
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelledMessage =
    location.state?.cancelledMessage ||
    (searchParams.get('tripCancelled') === '1' ? 'ドライバーにより乗車がキャンセルされました。' : '');

  useEffect(() => {
    let isMounted = true;

    async function prepareSearch() {
      try {
        await startDemoSearch();
        if (isMounted) {
          setSearchStatus(
            cancelledMessage
              ? '前回の乗車はキャンセルされました。新しいドライバーを探しています...'
              : 'ドライバーの承認を待っています...',
          );
        }
      } catch {
        if (isMounted) {
          setSearchStatus('配車リクエスト送信のため、データベースへ再接続しています...');
        }
      }
    }

    async function pollAcceptedRide() {
      const fallbackRide = getFallbackRide();
      if (fallbackRide?.status === 'ongoing') {
        navigate('/ride-status', { replace: true });
        return;
      }

      try {
        const ride = await getCurrentRideForCustomer();
        if (!isMounted) return;

        if (ride?.status === 'ongoing') {
          navigate('/ride-status', { replace: true });
          return;
        }

        setSearchStatus(
          cancelledMessage
            ? '前回の乗車はキャンセルされました。新しいドライバーを探しています...'
            : 'ドライバーの承認を待っています...',
        );
      } catch {
        if (isMounted) {
          setSearchStatus('ドライバー確認のため、データベースへ再接続しています...');
        }
      }
    }

    prepareSearch().then(pollAcceptedRide);
    const timer = window.setInterval(pollAcceptedRide, 2500);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [cancelledMessage, navigate]);

  async function cancelSearch() {
    setIsCancelling(true);
    try {
      await cancelDemoSearch();
    } finally {
      navigate('/home');
    }
  }

  return (
    <PageShell>
      <main className="search-screen">
        <Topbar>
          <div className="location-chip" aria-label="現在地">
            <span className="location-dot"></span>
            <span>ハノイ・ホアンキエム周辺</span>
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
                <h1 id="search-title">ドライバーを検索中</h1>
                <p>{searchStatus}</p>
                {cancelledMessage && (
                  <div className="cancelled-alert" role="status">
                    {cancelledMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="card-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={cancelSearch}
                disabled={isCancelling}
              >
                {isCancelling ? 'キャンセル中...' : '検索をキャンセル'}
              </button>
              <button className="submit-button" type="button" disabled>
                承認待ち
              </button>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
