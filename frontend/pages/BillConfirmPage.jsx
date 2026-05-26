import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { createRideRequest, postEstimate } from '../api/rides.js';
import { ApiError } from '../api/client.js';
import {
  getBookingDraft,
  saveBookingDraft,
  setActiveRequestId,
} from '../utils/bookingSession.js';
import '../styles/booking.css';

const VEHICLE_LABELS = { 4: 'スタンダード', 7: 'ミニバン', 9: 'プレミアム' };

function formatVnd(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

function routeFromDraft(draft) {
  return {
    pickup: { name: draft.pickupAddress, position: [draft.pickupLat, draft.pickupLng] },
    destination: {
      name: draft.dropoffAddress,
      address: draft.dropoffAddress,
      position: [draft.dropoffLat, draft.dropoffLng],
    },
    routePath: [
      [draft.pickupLat, draft.pickupLng],
      [draft.dropoffLat, draft.dropoffLng],
    ],
  };
}

export default function BillConfirmPage() {
  const navigate = useNavigate();
  const isDriver = localStorage.getItem('jpTaxiRole') === 'driver';
  const homePath = isDriver ? '/driver-home' : '/home';
  const accountPath = isDriver ? '/driver-info/basic' : '/user-info';
  const chatPath = isDriver ? '/messages/customer' : '/messages/driver';
  const draft = getBookingDraft();
  const [estimate, setEstimate] = useState(null);
  const [bookingMode, setBookingMode] = useState('self');
  const [accountOpen, setAccountOpen] = useState(false);
  const [proxyOpen, setProxyOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [proxyName, setProxyName] = useState(draft.actualPassengerName || '');
  const [proxyPhone, setProxyPhone] = useState(draft.actualPassengerPhone || '');
  const [note, setNote] = useState(draft.noteToDriver || '');
  const accountRef = useRef(null);

  const selectedRoute = useMemo(
    () => routeFromDraft(draft),
    [
      draft.pickupAddress,
      draft.pickupLat,
      draft.pickupLng,
      draft.dropoffAddress,
      draft.dropoffLat,
      draft.dropoffLng,
    ],
  );

  const routePoints = [
    {
      key: 'pickup',
      label: selectedRoute.pickup.name,
      meta: '出発地',
      time: '現在',
      position: selectedRoute.pickup.position,
      type: 'pickup',
    },
    {
      key: 'destination',
      label: selectedRoute.destination.name,
      meta: selectedRoute.destination.address,
      time: estimate ? `約${estimate.estimated_time_minutes}分` : '—',
      position: selectedRoute.destination.position,
      type: 'destination',
    },
  ];

  const routeSummary = estimate
    ? `${estimate.distance_km} km - ${estimate.estimated_time_minutes}分`
    : '—';

  useEffect(() => {
    function closeAccount(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    document.addEventListener('click', closeAccount);
    return () => document.removeEventListener('click', closeAccount);
  }, []);

  useEffect(() => {
    let cancelled = false;
    postEstimate({
      startLat: draft.pickupLat,
      startLng: draft.pickupLng,
      endLat: draft.dropoffLat,
      endLng: draft.dropoffLng,
      vehicleType: draft.vehicleType,
    })
      .then((data) => {
        if (!cancelled) setEstimate(data);
      })
      .catch(() => {
        if (!cancelled) setEstimate(null);
      });
    return () => {
      cancelled = true;
    };
  }, [draft.pickupLat, draft.pickupLng, draft.dropoffLat, draft.dropoffLng, draft.vehicleType]);

  function selectMode(mode) {
    setBookingMode(mode);
    if (mode === 'proxy') {
      setProxyOpen(true);
    }
  }

  async function confirmBooking() {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        pickupAddress: draft.pickupAddress,
        pickupLat: draft.pickupLat,
        pickupLng: draft.pickupLng,
        dropoffAddress: draft.dropoffAddress,
        dropoffLat: draft.dropoffLat,
        dropoffLng: draft.dropoffLng,
        vehicleType: draft.vehicleType,
        noteToDriver: note.trim() || undefined,
      };
      if (bookingMode === 'proxy') {
        payload.actualPassengerName = proxyName.trim() || undefined;
        payload.actualPassengerPhone = proxyPhone.trim() || undefined;
      }
      saveBookingDraft({ ...payload, noteToDriver: note.trim() || null });

      if (isDriver) {
        setToast('ドライバー画面では予約確定のデモのみです');
        window.setTimeout(() => navigate('/ride-status'), 700);
        return;
      }

      const result = await createRideRequest(payload);
      setActiveRequestId(result.request_id);
      setProxyOpen(false);
      setToast('予約内容を確認しました');
      window.setTimeout(() => navigate('/search-car'), 700);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '予約の確定に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  const distanceLabel = estimate ? `${estimate.distance_km} km` : '—';
  const timeLabel = estimate ? `${estimate.estimated_time_minutes}分` : '—';
  const fareLabel = estimate ? `${formatVnd(estimate.total_price)} ₫` : '—';

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
                    <strong>{draft.pickupAddress}</strong>
                  </div>
                </div>
                <div className="route-line"></div>
                <div className="route-point destination">
                  <span className="point-dot"></span>
                  <div>
                    <span>目的地</span>
                    <strong>{draft.dropoffAddress}</strong>
                  </div>
                </div>
              </div>

              <div className="trip-summary">
                <article>
                  <span>所要時間</span>
                  <strong>{timeLabel}</strong>
                </article>
                <article>
                  <span>走行距離</span>
                  <strong>{distanceLabel}</strong>
                </article>
                <article>
                  <span>見積料金</span>
                  <strong>{fareLabel}</strong>
                </article>
              </div>
            </section>

            <section className="section-card">
              <h2>車種</h2>
              <div className="vehicle-card">
                <span className="vehicle-icon">🚖</span>
                <div>
                  <strong>{VEHICLE_LABELS[draft.vehicleType] || 'スタンダード'}</strong>
                  <span>快適なセダン・禁煙車</span>
                </div>
                <strong className="vehicle-price">{fareLabel}</strong>
              </div>
            </section>

            <section className="section-card">
              <label className="memo-field">
                <span>ドライバーへのメモ (任意)</span>
                <textarea
                  placeholder="例: 大きな荷物があります、または待ち合わせ場所の詳細など..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
            </section>

            <section className="section-card fare-card">
              <h2>料金詳細</h2>
              <dl>
                <div>
                  <dt>見積合計</dt>
                  <dd>{fareLabel}</dd>
                </div>
                <div>
                  <dt>走行距離</dt>
                  <dd>{distanceLabel}</dd>
                </div>
              </dl>
              <div className="total-row">
                <span>合計金額 (見積)</span>
                <strong>{fareLabel}</strong>
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

            {error && (
              <p className="form-error" role="alert" style={{ margin: '0 0 12px' }}>
                {error}
              </p>
            )}

            <div className="action-row">
              <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to={homePath}>
                戻る
              </Link>
              {isDriver && (
                <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to={chatPath}>
                  連絡
                </Link>
              )}
              <button className="primary-button" type="button" onClick={confirmBooking} disabled={submitting}>
                {submitting ? '送信中…' : '予約を確定する'}
              </button>
            </div>
          </section>

          <section className="map-panel booking-route-map" aria-label="ルートマップ">
            <InteractiveRouteMap
              alternateRoutePath={[]}
              currentLocation={selectedRoute.pickup.position}
              route={routePoints}
              routePath={selectedRoute.routePath}
              routeSummary={routeSummary}
              scrollWheelZoom
              showCurrentLocation={false}
            />
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
                <input
                  type="text"
                  placeholder="例: 田中 太郎"
                  value={proxyName}
                  onChange={(event) => setProxyName(event.target.value)}
                />
              </label>
              <label>
                <span>連絡先電話番号</span>
                <input
                  type="tel"
                  placeholder="090-0000-0000"
                  value={proxyPhone}
                  onChange={(event) => setProxyPhone(event.target.value)}
                />
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
