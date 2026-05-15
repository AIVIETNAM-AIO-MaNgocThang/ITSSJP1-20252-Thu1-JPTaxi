import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function RideStatusPage() {
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
                <strong>あと 3 分</strong>
              </div>
              <em>0.8 km</em>
            </div>

            <div className="tracking-driver-row">
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" alt="" />
              <div>
                <strong>田中 ドライバー</strong>
                <small>トヨタ・ヴィオス (黒)</small>
                <em>30A-123.45</em>
              </div>
            </div>

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
