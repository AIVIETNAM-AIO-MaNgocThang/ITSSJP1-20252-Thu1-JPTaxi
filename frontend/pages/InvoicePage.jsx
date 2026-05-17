import { Link, useLocation } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import '../styles/app-pages.css';

export default function InvoicePage() {
  const location = useLocation();
  const isDriver = localStorage.getItem('jpTaxiRole') === 'driver' || location.pathname.startsWith('/driver');
  const closePath = isDriver ? '/driver-home' : '/driver-review';
  const closeLabel = isDriver ? '閉じる' : 'ドライバー評価へ';

  return (
    <PageShell withFooter={false}>
      <main className="invoice-screen">
        <section className="zip-invoice-container">
          <div className="zip-invoice-paper">
            <header>
              <div className="invoice-brand">🚕 JP TAXI</div>
              <div>
                <h1>電子領収書</h1>
                <p>NO. JPT-2026-0328</p>
              </div>
            </header>

            <div className="invoice-details-grid">
              <article><span>利用日時</span><strong>2026年3月28日 18:42</strong></article>
              <article><span>決済方法</span><strong>VISA (**** 4821)</strong></article>
              <article><span>乗車場所</span><strong>ホアンキエム湖</strong></article>
              <article><span>降車場所</span><strong>ロッテホテル</strong></article>
            </div>

            <table className="zip-invoice-table">
              <thead><tr><th>項目</th><th>金額</th></tr></thead>
              <tbody>
                <tr><td>タクシー運賃 (4.8 km)</td><td>¥618</td></tr>
                <tr><td>予約・配車手数料</td><td>¥62</td></tr>
              </tbody>
            </table>

            <div className="invoice-summary">
              <div className="qr-code" aria-hidden="true"><span></span></div>
              <div>
                <span>領収金額 (税込)</span>
                <strong>¥680</strong>
                <small>（内消費税10%：¥62）</small>
              </div>
            </div>
          </div>

          <div className="invoice-actions">
            <button type="button">📄 PDF保存</button>
            <button type="button">📧 メールで送信</button>
          </div>
          <Link className="invoice-close" to={closePath}>{closeLabel}</Link>
        </section>
      </main>
    </PageShell>
  );
}
