import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function InvoicePage() {
  return (
    <PageShell>
      <main className="app-screen">
        <Topbar />
        <section className="app-shell">
          <div className="profile-header">
            <div>
              <h1>電子領収書</h1>
              <p>乗車明細を確認できます。</p>
            </div>
            <Link className="secondary-button" style={{ width: 160, display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/payment">
              戻る
            </Link>
          </div>

          <section className="ticket-card" style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2 style={{ marginTop: 0 }}>JP TAXI RECEIPT</h2>
            <span className="muted-small">Receipt No. JP-20260514-0248</span>
            <div className="invoice-table stack">
              <div className="invoice-row"><span>乗車日時</span><strong>2026/05/14 14:05</strong></div>
              <div className="invoice-row"><span>乗車地</span><strong>ホアンキエム周辺</strong></div>
              <div className="invoice-row"><span>目的地</span><strong>ノイバイ国際空港</strong></div>
              <div className="invoice-row"><span>ドライバー</span><strong>田中 太郎</strong></div>
              <div className="invoice-row"><span>車両番号</span><strong>JP-248</strong></div>
              <div className="invoice-row"><span>支払い方法</span><strong>現金</strong></div>
              <div className="invoice-row total"><span>合計金額</span><strong>¥5,300</strong></div>
            </div>
            <Link className="submit-button stack" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/home">
              ホームへ戻る
            </Link>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
