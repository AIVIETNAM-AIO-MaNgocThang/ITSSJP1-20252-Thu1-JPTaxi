import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import InvoiceTemplate from '../components/InvoiceTemplate.jsx';
import PageShell from '../components/PageShell.jsx';
import { getTripInvoice, issueTripInvoice } from '../api/invoices.js';
import { ApiError } from '../api/client.js';
import { getLastInvoiceTripId } from '../utils/invoiceSession.js';
import { getAuthToken, getStoredUser, isDriverRole } from '../utils/session.js';
import '../styles/app-pages.css';

const DEMO_TRIP_ID = 1;

function resolveTripId(searchParams) {
  const fromQuery = searchParams.get('tripId');
  if (fromQuery) {
    const n = Number(fromQuery);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return getLastInvoiceTripId() ?? DEMO_TRIP_ID;
}

export default function InvoicePage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isDriver =
    isDriverRole() || location.pathname.startsWith('/driver-invoice');
  const closePath = isDriver ? '/driver-home' : '/driver-review';
  const closeLabel = isDriver ? '閉じる' : 'ドライバー評価へ';

  const tripId = resolveTripId(searchParams);
  const [invoice, setInvoice] = useState(null);
  const [canIssue, setCanIssue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');

  const loadInvoice = useCallback(async () => {
    if (!getAuthToken()) {
      setError('ログインしてから領収書を表示してください。');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getTripInvoice(tripId);
      setInvoice(data);
      setCanIssue(Boolean(data.canIssue));
      const user = getStoredUser();
      if (user?.email) {
        setEmail((prev) => prev || user.email);
      }
    } catch (err) {
      setInvoice(null);
      setError(
        err instanceof ApiError
          ? err.message
          : '領収書の読み込みに失敗しました。',
      );
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  async function handleIssue(sendEmail = false) {
    setIssuing(true);
    setActionMsg('');
    setError('');
    try {
      const payload = sendEmail && email.trim() ? { recipientEmail: email.trim() } : {};
      const result = await issueTripInvoice(tripId, payload);
      setInvoice(result.invoice);
      setCanIssue(false);
      setActionMsg(result.message);
      setEmailOpen(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : '領収書の発行に失敗しました。',
      );
    } finally {
      setIssuing(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <PageShell withFooter={false}>
      <main className="invoice-screen">
        <section className="zip-invoice-container">
          {loading && <p className="invoice-status">読み込み中…</p>}
          {error && (
            <p className="form-error invoice-status" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && invoice && (
            <InvoiceTemplate invoice={invoice} />
          )}

          {!loading && invoice && (
            <div className="invoice-actions">
              <button type="button" onClick={handlePrint} disabled={!invoice}>
                📄 PDF保存
              </button>
              <button
                type="button"
                onClick={() => {
                  if (invoice.issued) {
                    setEmailOpen(true);
                    return;
                  }
                  if (canIssue) {
                    setEmailOpen(true);
                  } else {
                    handleIssue(false);
                  }
                }}
                disabled={issuing || !invoice}
              >
                📧 メールで送信
              </button>
              {canIssue && (
                <button
                  type="button"
                  className="invoice-issue-btn"
                  disabled={issuing}
                  onClick={() => handleIssue(false)}
                >
                  {issuing ? '発行中…' : 'VAT領収書を発行'}
                </button>
              )}
            </div>
          )}

          {actionMsg && (
            <p className="invoice-toast" role="status">
              {actionMsg}
            </p>
          )}

          <Link className="invoice-close" to={closePath}>
            {closeLabel}
          </Link>
        </section>

        <div
          className={`payment-method-backdrop ${emailOpen ? 'open' : ''}`}
          onClick={() => setEmailOpen(false)}
        >
          <section
            className="payment-method-modal invoice-email-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-email-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="invoice-email-title">メールで領収書を送信</h2>
              <button type="button" aria-label="閉じる" onClick={() => setEmailOpen(false)}>
                ×
              </button>
            </header>
            <label className="invoice-email-field">
              <span>送信先メール</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </label>
            <button
              className="payment-method-confirm"
              type="button"
              disabled={issuing || !email.trim()}
              onClick={() => handleIssue(true)}
            >
              {issuing ? '送信中…' : '発行して送信'}
            </button>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
