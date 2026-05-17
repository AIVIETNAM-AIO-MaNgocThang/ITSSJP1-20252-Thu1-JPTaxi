import { Link } from 'react-router-dom';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function DriverRideStatusPage() {
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
          <InteractiveRouteMap className="tracking-route-map" compact />

          <section className="driver-tracking-card">
            <div className="tracking-eta-header">
              <div>
                <span>到着予定時間</span>
                <strong>あと 3 分</strong>
              </div>
              <em>0.8 km</em>
            </div>

            <div className="tracking-passenger-row">
              <span>👤</span>
              <div>
                <strong>JPTX-9821 様</strong>
                <small>ホアンキエム湖で待機中</small>
                <em>090-1234-5678</em>
              </div>
            </div>

            <div className="tracking-actions">
              <Link className="tracking-call" to="/messages/customer">📞 連絡する</Link>
              <Link className="tracking-message" to="/driver-invoice">📄 請求書へ</Link>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
