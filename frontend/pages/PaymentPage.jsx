import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import { setLastInvoiceTripId } from '../utils/invoiceSession.js';
import '../styles/app-pages.css';

const DEMO_TRIP_ID = 1;

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceTripId = Number(searchParams.get('tripId')) || DEMO_TRIP_ID;
  const [method, setMethod] = useState('クレジットカード (**** 4821)');
  const [methodOpen, setMethodOpen] = useState(false);
  const methods = ['クレジットカード (**** 4821)', '現金', 'PayPay', 'Apple Pay'];

  function confirmPayment() {
    setMethodOpen(false);
    setLastInvoiceTripId(invoiceTripId);
    navigate(`/driver-review?tripId=${invoiceTripId}`);
  }

  function openInvoice() {
    setLastInvoiceTripId(invoiceTripId);
  }

  return (
    <PageShell withFooter={false}>
      <main className="payment-complete-screen">
        <section className="receipt-card">
          <header className="receipt-header">
            <span>Arrived Safely</span>
            <h1>目的地に到着</h1>
            <p>乗車記録と料金の確認</p>
          </header>

          <div className="receipt-body">
            <section className="receipt-route">
              <div>
                <span className="route-dot green"></span>
                <div><strong>ホアンキエム湖</strong><small>18:30 出発</small></div>
              </div>
              <div>
                <span className="route-dot dark"></span>
                <div><strong>ロッテホテル ハノイ</strong><small>18:42 到着</small></div>
              </div>
            </section>

            <section className="receipt-billing">
              <div><span>運賃 (4.8 km)</span><strong>¥620</strong></div>
              <div><span>予約・サービス料</span><strong>¥60</strong></div>
              <div className="receipt-total"><span>お支払い合計</span><strong>¥680</strong></div>
            </section>

            <section className="payment-preview">
              <div><span>💳</span><strong>{method}</strong></div>
              <button type="button" onClick={() => setMethodOpen(true)}>変更 〉</button>
            </section>

            <div className="receipt-actions">
              <Link className="payment-back-link" to="/ride-status">戻る</Link>
              <button className="pay-confirm" type="button" onClick={confirmPayment}>お支払いを確定する</button>
              <Link
                className="invoice-link"
                to={`/invoice?tripId=${invoiceTripId}`}
                onClick={openInvoice}
              >
                <span>📄</span> 領収書を発行する
              </Link>
              <Link className="support-link" to="/messages/driver">お問い合わせはこちら</Link>
            </div>
          </div>
        </section>

        <div className={`payment-method-backdrop ${methodOpen ? 'open' : ''}`} onClick={() => setMethodOpen(false)}>
          <section className="payment-method-modal" role="dialog" aria-modal="true" aria-labelledby="payment-method-title" onClick={(event) => event.stopPropagation()}>
            <header>
              <h2 id="payment-method-title">支払い方法を選択</h2>
              <button type="button" aria-label="閉じる" onClick={() => setMethodOpen(false)}>×</button>
            </header>
            <div className="payment-method-list">
              {methods.map((item) => (
                <button className={method === item ? 'selected' : ''} type="button" key={item} onClick={() => setMethod(item)}>
                  <span>{item === '現金' ? '💵' : '💳'}</span>
                  <strong>{item}</strong>
                  <em>{method === item ? '選択中' : '選択'}</em>
                </button>
              ))}
            </div>
            <button className="payment-method-confirm" type="button" onClick={() => setMethodOpen(false)}>この方法にする</button>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
