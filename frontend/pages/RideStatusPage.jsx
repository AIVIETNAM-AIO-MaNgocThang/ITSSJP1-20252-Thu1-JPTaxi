import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { getFallbackRide, getCurrentRideForCustomer } from '../api/rides.js';
import '../styles/app-pages.css';

const cancelledMessage = 'ドライバーが乗車をキャンセルしました。';

export default function RideStatusPage() {
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [statusText, setStatusText] = useState('乗車情報を読み込み中です...');

  useEffect(() => {
    let isMounted = true;

    function applyRide(data) {
      if (!data) return false;

      if (data.status === 'cancelled') {
        navigate('/search-car?tripCancelled=1', {
          replace: true,
          state: { cancelledMessage },
        });
        return true;
      }

      setRide(data);
      setStatusText('');
      return true;
    }

    async function loadRide() {
      const fallbackRide = getFallbackRide();
      if (fallbackRide && applyRide(fallbackRide)) return;

      try {
        const data = await getCurrentRideForCustomer();
        if (!isMounted) return;

        if (!applyRide(data)) {
          setStatusText('現在進行中の乗車はありません。');
        }
      } catch {
        if (isMounted) {
          setStatusText('乗車情報を読み込めません。');
        }
      }
    }

    loadRide();
    const timer = window.setInterval(loadRide, 2500);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [navigate]);

  const driverName = ride?.driver?.name || 'ドライバー';
  const vehicleLine = [ride?.vehicle?.brand, ride?.vehicle?.color].filter(Boolean).join(' - ');
  const licensePlate = ride?.vehicle?.licensePlate || '確認中';

  return (
    <PageShell>
      <main className="user-tracking-screen">
        <Topbar
          brandTo="/home"
          actions={(
            <>
              <Link to="/home">ホーム</Link>
              <Link to="/user-info/profile">アカウント</Link>
              <img className="topbar-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" />
            </>
          )}
        />

        <section className="user-tracking-map">
          <span className="tracking-user-marker">📍</span>
          <span className="tracking-car-marker">🚕</span>

          <section className="tracking-card">
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
                <div className="tracking-driver-row">
                  <img src={ride.driver.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80'} alt="" />
                  <div>
                    <strong>{driverName}</strong>
                    <small>{vehicleLine || '標準車両'}</small>
                    <em>{licensePlate}</em>
                  </div>
                </div>

                <div className="tracking-route-note">
                  <strong>{ride.route.pickupAddress}</strong>
                  <span>{ride.route.dropoffAddress}</span>
                </div>

                <div className="tracking-actions">
                  <Link className="tracking-call" to="/messages/driver">📞 電話する</Link>
                  <Link className="tracking-message" to="/messages/driver">💬 メッセージ</Link>
                </div>
                <Link className="tracking-next" to="/payment">支払いへ進む</Link>
              </>
            )}
          </section>
        </section>
      </main>
    </PageShell>
  );
}
