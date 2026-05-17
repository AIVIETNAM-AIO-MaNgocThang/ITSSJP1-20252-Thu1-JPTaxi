import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { ensureDemoRide, setFallbackAcceptedRide } from '../api/rides.js';
import '../styles/app-pages.css';

export default function DriverDispatchPage() {
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const [notice, setNotice] = useState('');

  async function acceptRide() {
    if (isAccepting) return;

    setIsAccepting(true);
    setNotice('');

    try {
      await ensureDemoRide();
    } catch {
      setFallbackAcceptedRide();
      setNotice('サーバーに接続できないため、デモ状態で配車を承認しました。');
    } finally {
      window.setTimeout(() => navigate('/driver-ride-status'), 250);
    }
  }

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
            <p>新しい乗車依頼内容を確認してから承認してください。</p>

            <div className="dispatch-driver-box">
              <img src="https://i.pravatar.cc/150?u=driver_tanaka" alt="" />
              <div>
                <strong>田中 健一</strong>
                <span>● オンライン（待機中）</span>
              </div>
            </div>

            <section className="dispatch-card">
              <div className="dispatch-countdown">12s</div>
              <span>推定収益</span>
              <strong>¥1,250</strong>
              <div className="dispatch-actions">
                <Link className="dispatch-decline" to="/driver-home">拒否</Link>
                <button
                  className="dispatch-accept"
                  type="button"
                  onClick={acceptRide}
                  disabled={isAccepting}
                >
                  {isAccepting ? '承認中...' : '承認する'}
                </button>
              </div>
              {notice && <div className="dispatch-notice" role="status">{notice}</div>}
            </section>

            <section className="dispatch-customer-card">
              <p>お客様情報</p>
              <div>
                <span>
                  <strong>JPTX-9821 様</strong>
                  <em>📞 090-1234-5678</em>
                </span>
                <Link to="/messages/customer">連絡する</Link>
              </div>
            </section>
          </div>

          <div className="driver-dispatch-map">
            <span className="dispatch-map-label pickup">ホアンキエム湖（乗車）</span>
            <span className="dispatch-map-label drop">ロッテホテル（降車）</span>
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
