import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function PaymentPage() {
  return (
    <PageShell>
      <main className="app-screen">
        <Topbar />
        <section className="app-shell">
          <div className="profile-header">
            <div>
              <h1>支払い</h1>
              <p>乗車が完了しました。料金を確認して支払いへ進みます。</p>
            </div>
          </div>

          <div className="two-column-layout">
            <section className="ticket-card">
              <h2 className="panel-title">今回の乗車</h2>
              <div className="route-line-card">
                <div className="route-step"><span className="step-dot">A</span><div><strong>ホアンキエム周辺</strong><span className="muted-small">14:05 出発</span></div></div>
                <div className="route-step"><span className="step-dot dark">B</span><div><strong>ノイバイ国際空港</strong><span className="muted-small">14:43 到着</span></div></div>
              </div>
              <div className="stat-grid stack">
                <div className="stat-box"><span>距離</span><strong>28.4 km</strong></div>
                <div className="stat-box"><span>時間</span><strong>38分</strong></div>
                <div className="stat-box"><span>支払い</span><strong>現金</strong></div>
              </div>
            </section>

            <aside className="panel">
              <h2 className="panel-title">料金明細</h2>
              <div className="fare-table">
                <div className="fare-row"><span>基本料金</span><strong>¥1,200</strong></div>
                <div className="fare-row"><span>距離料金</span><strong>¥3,600</strong></div>
                <div className="fare-row"><span>時間料金</span><strong>¥500</strong></div>
                <div className="fare-row total"><span>合計</span><strong>¥5,300</strong></div>
              </div>
              <Link className="submit-button stack" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/invoice">
                領収書を発行
              </Link>
              <Link className="secondary-button stack" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/driver-review">
                ドライバーを評価
              </Link>
            </aside>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
