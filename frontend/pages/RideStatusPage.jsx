import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function RideStatusPage() {
  return (
    <PageShell>
      <main className="app-screen">
        <Topbar />
        <section className="app-shell">
          <div className="profile-header">
            <div>
              <h1>タクシー到着待ち</h1>
              <p>ドライバーが乗車地点へ向かっています。</p>
            </div>
            <Link className="submit-button" style={{ width: 160, display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/messages">
              連絡する
            </Link>
          </div>

          <div className="two-column-layout">
            <section className="map-panel" aria-label="配車状況マップ">
              <span className="map-marker start">A</span>
              <span className="map-marker end">B</span>
              <span className="map-marker driver">🚕</span>
            </section>

            <aside className="panel">
              <h2 className="panel-title">到着予定</h2>
              <div className="arrival-row">
                <div><strong>あと5分</strong><span className="muted-small">予定到着 14:25</span></div>
                <strong>JP-248</strong>
              </div>
              <div className="driver-row">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" alt="driver" />
                <div>
                  <strong>田中 太郎</strong>
                  <span className="muted-small">評価 4.9 / トヨタ Prius</span>
                </div>
              </div>
              <div className="timeline stack">
                <div className="timeline-item">
                  <span className="timeline-dot">✓</span>
                  <div><strong>配車確定</strong><span className="muted-small">ドライバーが決まりました</span></div>
                </div>
                <div className="timeline-item">
                  <span className="timeline-dot">2</span>
                  <div><strong>迎車中</strong><span className="muted-small">乗車地点へ移動中です</span></div>
                </div>
                <div className="timeline-item pending">
                  <span className="timeline-dot">3</span>
                  <div><strong>乗車</strong><span className="muted-small">到着後に通知します</span></div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
