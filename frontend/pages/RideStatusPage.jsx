import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { getRideRequest } from '../api/rides.js';
import { getActiveRequestId } from '../utils/bookingSession.js';
import '../styles/app-pages.css';

export default function RideStatusPage() {
  const requestId = getActiveRequestId();
  const [ride, setRide] = useState(null);

  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await getRideRequest(requestId);
        if (!cancelled) setRide(data);
      } catch {
        if (!cancelled) setRide(null);
      }
    }

    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [requestId]);

  const driver = ride?.assigned_driver;
  const driverName = driver
    ? `${driver.last_name} ${driver.first_name}`
    : 'ドライバー';
  const vehicle = driver?.vehicle;
  const vehicleLabel = vehicle
    ? `${vehicle.brand} (${vehicle.color})`
    : '車両情報';
  const plate = vehicle?.license_plate ?? '—';
  const eta = ride?.estimate?.estimated_time_minutes
    ? `あと ${ride.estimate.estimated_time_minutes} 分`
    : 'あと 3 分';
  const distance = ride?.estimate?.distance_km
    ? `${ride.estimate.distance_km} km`
    : '—';

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
                <strong>{eta}</strong>
              </div>
              <em>{distance}</em>
            </div>

            <div className="tracking-driver-row">
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" alt="" />
              <div>
                <strong>{driverName}</strong>
                <small>{vehicleLabel}</small>
                <em>{plate}</em>
              </div>
            </div>

            {ride && (
              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', opacity: 0.85 }}>
                ステータス: <strong>{ride.status}</strong>
                {ride.pickup_address && ` · ${ride.pickup_address}`}
              </p>
            )}

            <div className="tracking-actions">
              <Link className="tracking-call" to="/messages/driver">📞 電話する</Link>
              <Link className="tracking-message" to="/messages/driver">💬 メッセージ</Link>
            </div>
            <Link className="tracking-next" to="/payment">支払いへ進む</Link>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
