import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function AdvanceBookingPage() {
  return (
    <PageShell>
      <main className="app-screen">
        <Topbar />
        <section className="app-shell">
          <div className="profile-header">
            <div>
              <h1>予約日時を指定</h1>
              <p>空港送迎や予定移動のために、事前予約を作成します。</p>
            </div>
          </div>

          <div className="two-column-layout">
            <section className="panel">
              <h2 className="panel-title">予約内容</h2>
              <div className="form-grid">
                <label><span>予約日</span><input type="date" defaultValue="2026-05-15" /></label>
                <label><span>出発時刻</span><input type="time" defaultValue="09:30" /></label>
                <label className="field full"><span>乗車地</span><input defaultValue="ハノイ・ホアンキエム周辺" /></label>
                <label className="field full"><span>目的地</span><input defaultValue="ノイバイ国際空港" /></label>
                <label><span>人数</span><select defaultValue="2"><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
                <label><span>車種</span><select defaultValue="standard"><option value="standard">スタンダード</option><option value="large">大型車</option><option value="premium">プレミアム</option></select></label>
                <label className="field full"><span>メモ</span><textarea placeholder="荷物、待ち合わせ場所など" /></label>
              </div>
              <Link className="submit-button stack" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/reservation-summary">予約内容を確認</Link>
            </section>

            <aside className="panel">
              <h2 className="panel-title">見積り</h2>
              <div className="fare-table">
                <div className="fare-row"><span>基本料金</span><strong>¥1,200</strong></div>
                <div className="fare-row"><span>距離料金</span><strong>¥3,600</strong></div>
                <div className="fare-row"><span>予約手数料</span><strong>¥400</strong></div>
                <div className="fare-row total"><span>合計</span><strong>¥5,200</strong></div>
              </div>
              <div className="notice-box stack">出発10分前にドライバー情報を通知します。</div>
            </aside>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
