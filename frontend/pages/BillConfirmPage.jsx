import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resolveAssetUrl } from '../api/accounts.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/booking.css';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getChatPath, saveActiveChatSession } from '../utils/chatSession.js';
import { fetchDrivingRoute, formatDistance, formatDuration, hasDrivingRoutePath } from '../utils/routePlanner.js';

const customerFallbackAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';
const driverFallbackAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

const fallbackRoute = {
  destination: {
    name: 'ロッテホテル ハノイ',
    address: '54 Liễu Giai, Ba Đình, Hà Nội',
    position: [21.03205, 105.81283],
  },
  pickup: {
    name: 'ホアンキエム湖',
    position: [21.02878, 105.85204],
  },
  routeMetrics: {
    duration: '12分',
    distance: '4.8 km',
    fare: '¥680',
  },
  routePath: [
    [21.02878, 105.85204],
    [21.02812, 105.85046],
    [21.02672, 105.84817],
    [21.02482, 105.85672],
    [21.02621, 105.84666],
    [21.02942, 105.83628],
    [21.03162, 105.82084],
    [21.03205, 105.81283],
  ],
};

function readSelectedRoute() {
  try {
    const rawRoute = window.sessionStorage.getItem('jpTaxiSelectedRoute');
    if (!rawRoute) return fallbackRoute;

    const parsedRoute = JSON.parse(rawRoute);
    const destinationPosition = parsedRoute.destination?.position;
    const pickupPosition = parsedRoute.pickup?.position;

    if (!Array.isArray(destinationPosition) || !Array.isArray(pickupPosition)) {
      return fallbackRoute;
    }

    return {
      ...fallbackRoute,
      ...parsedRoute,
      routePath: hasDrivingRoutePath(parsedRoute.routePath) ? parsedRoute.routePath : [],
      routeMetrics: {
        ...fallbackRoute.routeMetrics,
        ...parsedRoute.routeMetrics,
      },
    };
  } catch {
    return fallbackRoute;
  }
}

export default function BillConfirmPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isDriver = localStorage.getItem('jpTaxiRole') === 'driver';
  const homePath = isDriver ? '/driver-home' : '/home';
  const accountPath = isDriver ? '/driver-info/basic' : '/user-info';
  const messagePath = isDriver ? '/messages/customer' : '/messages/driver';
  const avatarStorageKey = isDriver ? 'jpTaxiDriverAvatarUrl' : 'jpTaxiCustomerAvatarUrl';
  const fallbackAvatar = isDriver ? driverFallbackAvatar : customerFallbackAvatar;
  const [topbarAvatar, setTopbarAvatar] = useState(() => resolveAssetUrl(localStorage.getItem(avatarStorageKey)) || fallbackAvatar);
  const [bookingMode, setBookingMode] = useState('self');
  const [proxyOpen, setProxyOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(readSelectedRoute);
  const displayDistance = selectedRoute.routeMetrics.distance;
  const routeSummary = `${displayDistance} - ${selectedRoute.routeMetrics.duration}`;

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
      time: `約${selectedRoute.routeMetrics.duration}`,
      position: selectedRoute.destination.position,
      type: 'destination',
    },
  ];

  useEffect(() => {
    const controller = new AbortController();

    fetchDrivingRoute(
      selectedRoute.pickup.position,
      selectedRoute.destination.position,
      { signal: controller.signal },
    )
      .then((route) => {
        setSelectedRoute((current) => {
          const nextRoute = {
            ...current,
            routePath: route.routePath,
            routeMetrics: {
              ...current.routeMetrics,
              distance: formatDistance(route.distance),
              duration: formatDuration(route.duration, route.distance),
              distanceMeters: route.distance,
            },
          };
          window.sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify(nextRoute));
          return nextRoute;
        });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          /* Keep the stored route when the routing service is unavailable. */
        }
      });

    return () => controller.abort();
  }, [selectedRoute.destination.position, selectedRoute.pickup.position]);

  useEffect(() => {
    function syncTopbarAvatar() {
      setTopbarAvatar(resolveAssetUrl(localStorage.getItem(avatarStorageKey)) || fallbackAvatar);
    }

    syncTopbarAvatar();
    window.addEventListener('storage', syncTopbarAvatar);
    window.addEventListener('focus', syncTopbarAvatar);

    return () => {
      window.removeEventListener('storage', syncTopbarAvatar);
      window.removeEventListener('focus', syncTopbarAvatar);
    };
  }, [avatarStorageKey, fallbackAvatar]);

  function selectMode(mode) {
    setBookingMode(mode);
    if (mode === 'proxy') {
      setProxyOpen(true);
    }
  }

  function confirmBooking() {
    saveActiveChatSession({
      tripId: selectedRoute.tripId ?? selectedRoute.trip_id ?? `local-trip-${Date.now()}`,
      requestId: selectedRoute.requestId ?? selectedRoute.request_id ?? `local-request-${Date.now()}`,
      customerId: selectedRoute.customerId ?? selectedRoute.customer_id ?? localStorage.getItem('jpTaxiUserId') ?? 1,
      driverId: selectedRoute.driverId ?? selectedRoute.driver_id ?? 1,
    });
    setProxyOpen(false);
    setToast('予約内容を確認しました');
    window.setTimeout(() => navigate(isDriver ? '/ride-status' : '/search-car'), 700);
  }

  return (
    <PageShell>
      <main className="booking-screen">
        <Topbar brandTo={homePath} actions={(
          <>
            <Link to={homePath}>{t('navHome')}</Link>
            <Link to={messagePath}>{t('navMessages')}</Link>
            <Link to={accountPath}>{t('navAccount')}</Link>
            <img className="topbar-avatar" src={topbarAvatar} alt="" />
          </>
        )} />

        <section className="booking-layout">
          <section className="confirm-panel" aria-labelledby="page-title">
            <div className="page-heading">
              <h1 id="page-title">{t('routeConfirmTitle')}</h1>
              <p>{t('routeConfirmCopy')}</p>
            </div>

            <section className="section-card">
              <h2>{t('pickupRoute')}</h2>
              <div className="route-list">
                <div className="route-point pickup">
                  <span className="point-dot"></span>
                  <div>
                    <span>{t('pickupPoint')}</span>
                    <strong>{selectedRoute.pickup.name}</strong>
                  </div>
                </div>
                <div className="route-line"></div>
                <div className="route-point destination">
                  <span className="point-dot"></span>
                  <div>
                    <span>{t('destination')}</span>
                    <strong>{selectedRoute.destination.name}</strong>
                  </div>
                </div>
              </div>

              <div className="trip-summary">
                <article>
                  <span>{t('rideTime')}</span>
                  <strong>{t('now')}</strong>
                </article>
                <article>
                  <span>{t('duration')}</span>
                  <strong>{selectedRoute.routeMetrics.duration}</strong>
                </article>
                <article>
                  <span>{t('distance')}</span>
                  <strong>{displayDistance}</strong>
                </article>
              </div>
            </section>

            {selectedRoute.routeMetrics.isLongDistance && (
              <div className="booking-route-warning">
                {t('routeLongWarning')}
              </div>
            )}

            <section className="section-card">
              <h2>{t('vehicleType')}</h2>
              <div className="vehicle-card">
                <span className="vehicle-icon">🚖</span>
                <div>
                  <strong>{t('standard')}</strong>
                  <span>{t('standardCopy')}</span>
                </div>
                <strong className="vehicle-price">{selectedRoute.routeMetrics.fare}</strong>
              </div>
            </section>

            <section className="section-card">
              <label className="memo-field">
                <span>{t('memoToDriver')}</span>
                <textarea placeholder={t('memoPlaceholder')} />
              </label>
            </section>

            <section className="section-card fare-card">
              <h2>{t('fareDetails')}</h2>
              <dl>
                <div>
                  <dt>{t('baseFare')}</dt>
                  <dd>¥500</dd>
                </div>
                <div>
                  <dt>{t('distanceFare')}</dt>
                  <dd>{selectedRoute.routeMetrics.distance === fallbackRoute.routeMetrics.distance ? '¥120' : '自動計算'}</dd>
                </div>
                <div>
                  <dt>{t('bookingFee')}</dt>
                  <dd>¥60</dd>
                </div>
              </dl>
              <div className="total-row">
                <span>{t('totalFare')}</span>
                <strong>{selectedRoute.routeMetrics.fare}</strong>
              </div>
            </section>

            <div className="booking-mode" role="group" aria-label="予約タイプ">
              <button
                className={`mode-button ${bookingMode === 'self' ? 'active' : ''}`}
                type="button"
                onClick={() => selectMode('self')}
              >
                {t('selfBooking')}
              </button>
              <button
                className={`mode-button ${bookingMode === 'proxy' ? 'active' : ''}`}
                type="button"
                onClick={() => selectMode('proxy')}
              >
                {t('proxyBooking')}
              </button>
            </div>

            <div className="action-row">
              <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/location-search">
                {t('back')}
              </Link>
              {isDriver && (
                <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to={getChatPath(isDriver ? 'customer' : 'driver')}>
                  連絡
                </Link>
              )}
              <button className="primary-button" type="button" onClick={confirmBooking}>
                {t('confirmBooking')}
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
              showRoute={hasDrivingRoutePath(selectedRoute.routePath)}
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
