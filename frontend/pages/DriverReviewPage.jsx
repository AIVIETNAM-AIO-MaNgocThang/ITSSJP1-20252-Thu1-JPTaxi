import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function DriverReviewPage() {
  return (
    <PageShell>
      <main className="app-screen">
        <Topbar />
        <section className="app-shell">
          <div className="profile-header">
            <div>
              <h1>ドライバー評価</h1>
              <p>サービス向上のため、今回の乗車を評価してください。</p>
            </div>
          </div>

          <section className="panel" style={{ maxWidth: 680, margin: '0 auto' }}>
            <div className="driver-row">
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" alt="driver" />
              <div>
                <strong>田中 太郎</strong>
                <span className="muted-small">JP-248 / トヨタ Prius</span>
              </div>
            </div>

            <div className="rating-stars" aria-label="rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button type="button" key={star}>★</button>
              ))}
            </div>

            <label>
              <span>コメント</span>
              <textarea placeholder="運転、対応、車内の清潔さなど" />
            </label>

            <div className="card-actions">
              <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/invoice">
                スキップ
              </Link>
              <Link className="submit-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/home">
                送信する
              </Link>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
