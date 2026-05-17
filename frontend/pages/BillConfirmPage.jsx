import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/booking.css';

export default function BillConfirmPage() {
  const navigate = useNavigate();
  const isDriver = localStorage.getItem('jpTaxiRole') === 'driver';
  const homePath = isDriver ? '/driver-home' : '/home';
  const accountPath = isDriver ? '/driver-info/basic' : '/user-info';
  const chatPath = isDriver ? '/messages/customer' : '/messages/driver';
  const [bookingMode, setBookingMode] = useState('self');
  const [accountOpen, setAccountOpen] = useState(false);
  const [proxyOpen, setProxyOpen] = useState(false);
  const [toast, setToast] = useState('');
  const accountRef = useRef(null);

  useEffect(() => {
    function closeAccount(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    document.addEventListener('click', closeAccount);
    return () => document.removeEventListener('click', closeAccount);
  }, []);

  function selectMode(mode) {
    setBookingMode(mode);
    if (mode === 'proxy') {
      setProxyOpen(true);
    }
  }

  function confirmBooking() {
    setProxyOpen(false);
    setToast('予約内容を確認しました');
    window.setTimeout(() => navigate('/search-car'), 700);
  }

  return (
    <PageShell>
      <main className="booking-screen">
        <Topbar brandTo={homePath}>
          <div className="account-menu" ref={accountRef}>
            <button
              className="profile-button"
              type="button"
              aria-label="プロフィール"
              aria-expanded={accountOpen}
              onClick={(event) => {
                event.stopPropagation();
                setAccountOpen((current) => !current);
              }}
            >
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" />
            </button>
            <div className={`account-dropdown ${accountOpen ? 'open' : ''}`} aria-hidden={!accountOpen}>
              <button type="button" onClick={() => navigate(accountPath)}>会員情報変更</button>
              <button type="button">ログアウト</button>
            </div>
          </div>
        </Topbar>

        <section className="booking-layout">
          <section className="confirm-panel" aria-labelledby="page-title">
            <div className="page-heading">
              <h1 id="page-title">予約内容を確認</h1>
              <p>最終的なルートと料金を確認してください。</p>
            </div>

            <section className="section-card">
              <h2>乗車ルート</h2>
              <div className="route-list">
                <div className="route-point pickup">
                  <span className="point-dot"></span>
                  <div>
                    <span>出発地</span>
                    <strong>ホアンキエム湖</strong>
                  </div>
                </div>
                <div className="route-line"></div>
                <div className="route-point destination">
                  <span className="point-dot"></span>
                  <div>
                    <span>目的地</span>
                    <strong>ロッテホテル ハノイ</strong>
                  </div>
                </div>
              </div>

              <div className="trip-summary">
                <article>
                  <span>乗車予定</span>
                  <strong>18:30</strong>
                </article>
                <article>
                  <span>所要時間</span>
                  <strong>12分</strong>
                </article>
                <article>
                  <span>走行距離</span>
                  <strong>4.8 km</strong>
                </article>
              </div>
            </section>

            <section className="section-card">
              <h2>車種</h2>
              <div className="vehicle-card">
                <span className="vehicle-icon">🚖</span>
                <div>
                  <strong>スタンダード</strong>
                  <span>快適なセダン・禁煙車</span>
                </div>
                <strong className="vehicle-price">¥680</strong>
              </div>
            </section>

            <section className="section-card">
              <label className="memo-field">
                <span>ドライバーへのメモ (任意)</span>
                <textarea placeholder="例: 大きな荷物があります、または待ち合わせ場所の詳細など..." />
              </label>
            </section>

            <section className="section-card fare-card">
              <h2>料金詳細</h2>
              <dl>
                <div>
                  <dt>基本運賃</dt>
                  <dd>¥500</dd>
                </div>
                <div>
                  <dt>距離加算</dt>
                  <dd>¥120</dd>
                </div>
                <div>
                  <dt>予約手数料</dt>
                  <dd>¥60</dd>
                </div>
              </dl>
              <div className="total-row">
                <span>合計金額</span>
                <strong>¥680</strong>
              </div>
            </section>

            <div className="booking-mode" role="group" aria-label="予約タイプ">
              <button
                className={`mode-button ${bookingMode === 'self' ? 'active' : ''}`}
                type="button"
                onClick={() => selectMode('self')}
              >
                自分用
              </button>
              <button
                className={`mode-button ${bookingMode === 'proxy' ? 'active' : ''}`}
                type="button"
                onClick={() => selectMode('proxy')}
              >
                代理予約
              </button>
            </div>

            <div className="action-row">
              <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to={homePath}>
                戻る
              </Link>
              {isDriver && (
                <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to={chatPath}>
                  連絡
                </Link>
              )}
              <button className="primary-button" type="button" onClick={confirmBooking}>
                予約を確定する
              </button>
            </div>
          </section>

          <section className="map-panel" aria-label="ルートマップ">
            <div className="map-label pickup-label">ホアンキエム湖</div>
            <div className="map-label destination-label">ロッテホテル</div>
            <svg className="route-svg" viewBox="0 0 420 760" preserveAspectRatio="none" aria-hidden="true">
              <path d="M142 230 C260 342 292 452 264 612" />
            </svg>
            <span className="map-pin pickup-pin"></span>
            <span className="map-pin destination-pin"></span>
          </section>
        </section>

        <div className={`modal-backdrop ${proxyOpen ? 'open' : ''}`} aria-hidden={!proxyOpen} onClick={() => setProxyOpen(false)}>
          <section className="proxy-modal" role="dialog" aria-modal="true" aria-labelledby="proxy-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 id="proxy-title">代理予約の乗車者情報</h2>
              <button className="modal-close" type="button" aria-label="閉じる" onClick={() => setProxyOpen(false)}>×</button>
            </div>
            <p className="modal-copy">代理予約に切り替えたため、実際に乗車する方の情報を入力してください。</p>
            <div className="proxy-fields">
              <label>
                <span>乗車者氏名</span>
                <input type="text" placeholder="例: 田中 太郎" />
              </label>
              <label>
                <span>連絡先電話番号</span>
                <input type="tel" placeholder="090-0000-0000" />
              </label>
            </div>

            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setProxyOpen(false)}>後で入力</button>
              <button className="primary-button" type="button" onClick={() => setProxyOpen(false)}>保存する</button>
            </div>
          </section>
        </div>

        <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">{toast}</div>
      </main>
    </PageShell>
  );
}
