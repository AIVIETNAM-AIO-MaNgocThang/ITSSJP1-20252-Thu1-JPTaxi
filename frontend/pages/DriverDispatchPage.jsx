import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function DriverDispatchPage() {
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

            <div className="dispatch-driver-box">
              <img src="https://i.pravatar.cc/150?u=driver_tanaka" alt="" />
              <div>
                <strong>田中 健一</strong>
                <span>● オンライン (待機中)</span>
              </div>
            </div>

            <section className="dispatch-card">
              <div className="dispatch-countdown">12s</div>
              <span>推定収益</span>
              <strong>¥1,250</strong>
              <div className="dispatch-actions">
                <Link className="dispatch-decline" to="/driver-home">拒否</Link>
                <Link className="dispatch-accept" to="/driver-ride-status">承認する</Link>
              </div>
            </section>

            <section className="dispatch-customer-card">
              <p>お客様情報 (Khách hàng)</p>
              <div>
                <span>
                  <strong>JPTX-9821 様</strong>
                  <em>📞 090-1234-5678</em>
                </span>
                <Link to="/messages/customer">通話する</Link>
              </div>
            </section>
          </div>

          <div className="driver-dispatch-map">
            <span className="dispatch-map-label pickup">ホアンキエム湖 (乗車)</span>
            <span className="dispatch-map-label drop">ロッテホテル (降車)</span>
            <section className="dispatch-floating-details">
              <div className="dispatch-passenger-row">
                <span>👤</span>
                <div>
                  <strong>乗客: JPTX-9821</strong>
                  <small>📞 090-1234-5678</small>
                </div>
              </div>
              <div className="dispatch-stats">
                <article><span>迎車時間</span><strong>4分</strong></article>
                <article><span>走行距離</span><strong>4.8km</strong></article>
                <article><span>移動時間</span><strong>12分</strong></article>
              </div>
            </section>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
