import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resolveAssetUrl } from '../api/accounts.js';
import { getActiveDriverRide, getActiveRide } from '../api/rides.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';
import { useLanguage } from '../context/LanguageContext.jsx';
import { buildSelectedRoute, geocodePlace, getCurrentPosition, reverseGeocodePosition } from '../utils/routePlanner.js';
import { readSavedPlaces } from '../utils/savedPlaces.js';
import { getRideContinuationPath, syncActiveRideSession } from '../utils/activeRideNavigation.js';

const customerFallbackAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';
const driverFallbackAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

const userHome = {
  brandTo: '/home',
  searchTo: '/location-search',
  fastTo: '/location-search',
};

const driverHome = {
  brandTo: '/driver-home',
  searchTo: '/xacnhancuocxe',
  fastTo: '/xacnhancuocxe',
};

export default function HomeExperience({ mode = 'user' }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const content = mode === 'driver' ? driverHome : userHome;
  const isUserMode = mode !== 'driver';
  const avatarStorageKey = isUserMode ? 'jpTaxiCustomerAvatarUrl' : 'jpTaxiDriverAvatarUrl';
  const fallbackAvatar = isUserMode ? customerFallbackAvatar : driverFallbackAvatar;
  const [topbarAvatar, setTopbarAvatar] = useState(() => resolveAssetUrl(localStorage.getItem(avatarStorageKey)) || fallbackAvatar);
  const [savedPlaces] = useState(readSavedPlaces);
  const [quickLoading, setQuickLoading] = useState(null);
  const [rideContinuationPath, setRideContinuationPath] = useState(null);

  const quickItems = isUserMode
    ? Object.entries(savedPlaces).map(([key, place]) => ({
        ...place,
        key,
        title: key === 'work' ? t('quickWork') : key === 'home' ? t('quickHome') : t('quickFavorite'),
      }))
    : [
        { icon: '👤', title: t('driverProfile'), copy: t('editPublicInfo'), to: '/driver-info/basic' },
        { icon: '💬', title: t('chat'), copy: t('contactCustomer'), to: '/messages/customer' },
        { icon: '📍', title: t('standbyStatus'), copy: t('showTimeDistance'), to: '/driver-ride-status' },
      ];

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

  useEffect(() => {
    let ignored = false;
    const role = isUserMode ? 'customer' : 'driver';
    const loadActiveRide = isUserMode ? getActiveRide : getActiveDriverRide;

    loadActiveRide()
      .then((activeRide) => {
        if (ignored) return;
        syncActiveRideSession(activeRide);
        setRideContinuationPath(getRideContinuationPath(role, activeRide));
      })
      .catch(() => {
        if (!ignored) setRideContinuationPath(null);
      });

    return () => {
      ignored = true;
    };
  }, [isUserMode]);

  async function openRideAwarePath(event, fallbackPath) {
    event.preventDefault();
    const role = isUserMode ? 'customer' : 'driver';
    const loadActiveRide = isUserMode ? getActiveRide : getActiveDriverRide;

    try {
      const activeRide = await loadActiveRide();
      syncActiveRideSession(activeRide);
      navigate(getRideContinuationPath(role, activeRide) || fallbackPath);
    } catch {
      navigate(rideContinuationPath || fallbackPath);
    }
  }

  async function openQuickPlace(item) {
    if (!isUserMode) return;

    if (!item.address?.trim()) {
      navigate('/user-info/profile');
      return;
    }

    setQuickLoading(item.key);

    try {
      const destination = await geocodePlace(item.address);
      const pendingDestination = {
        ...destination,
        name: item.title,
        address: destination.address || item.address,
        query: item.address,
      };

      window.sessionStorage.setItem('jpTaxiPendingDestination', JSON.stringify(pendingDestination));

      const rawPickup = await getCurrentPosition({ allowFallback: false, maximumAge: 0, timeout: 12000 });
      const pickup = await reverseGeocodePosition(rawPickup).catch(() => ({
        ...rawPickup,
        name: t('currentLocation'),
        address: t('currentLocation'),
      }));
      const selectedRoute = await buildSelectedRoute(pendingDestination, pickup);

      if (selectedRoute.routeMetrics.isTooFar) {
        navigate('/location-search');
        return;
      }

      window.sessionStorage.removeItem('jpTaxiPendingDestination');
      window.sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify(selectedRoute));
      navigate('/bill-confirm');
    } catch {
      navigate('/location-search');
    } finally {
      setQuickLoading(null);
    }
  }

  const topbarActions = (
    <>
      <Link to={isUserMode ? '/home' : '/driver-home'}>{t('navHome')}</Link>
      <Link to={isUserMode ? '/messages/driver' : '/messages/customer'}>{t('navMessages')}</Link>
      <Link to={isUserMode ? '/user-info/profile' : '/driver-info/basic'}>{isUserMode ? t('navAccount') : t('driverInfo')}</Link>
      <img className="topbar-avatar" src={topbarAvatar} alt="" />
    </>
  );

  return (
    <PageShell>
      <main className="home-window">
        <Topbar brandTo={content.brandTo} actions={topbarActions} />

        <section className="zip-home-hero">
          <InteractiveRouteMap
            className="home-background-map"
            centerOnCurrentLocation
            fitToRoute={false}
            interactive
            mapZoom={15}
            scrollWheelZoom
            showControls
            showCurrentLocation
            showDetails={false}
            showDriver={false}
            showMarkers={false}
            showRoute={false}
          />

          <div className="zip-home-panel">
            <h1>{t('homeGreeting')}</h1>
            <p className="zip-home-question">{isUserMode ? t('homeQuestion') : t('nextRideQuestion')}</p>

            <Link className="zip-search-card" to={rideContinuationPath || content.searchTo} onClick={(event) => openRideAwarePath(event, content.searchTo)}>
              <span className="zip-search-icon" aria-hidden="true">📍</span>
              <span>
                <strong>{isUserMode ? t('homeSearchTitle') : t('driverHomeSearchTitle')}</strong>
                <small>{isUserMode ? t('homeSearchCopy') : t('driverHomeSearchCopy')}</small>
              </span>
            </Link>

            <div className="zip-quick-row">
              {quickItems.map((item) => {
                const body = (
                  <>
                    <span>{item.icon}</span>
                    <div>
                      <strong>{quickLoading === item.key ? t('searching') : item.title}</strong>
                      <small>{item.address || item.copy || t('setAddressInProfile')}</small>
                    </div>
                  </>
                );

                if (isUserMode) {
                  return (
                    <button className="zip-quick-box" type="button" key={item.key} onClick={() => openQuickPlace(item)}>
                      {body}
                    </button>
                  );
                }

                return item.to ? (
                  <Link className="zip-quick-box" to={item.to} key={item.title}>
                    {body}
                  </Link>
                ) : (
                  <article className="zip-quick-box" key={item.title}>
                    {body}
                  </article>
                );
              })}
            </div>

            <Link className="zip-fast-button" to={rideContinuationPath || content.fastTo} onClick={(event) => openRideAwarePath(event, content.fastTo)}>
              <span aria-hidden="true">🚖</span>
              <span><strong>{isUserMode ? t('callTaxiNow') : t('goToDispatchConfirm')}</strong><small>{isUserMode ? t('bookNow') : t('afterDispatchConfirm')}</small></span>
            </Link>
          </div>

        </section>
      </main>
    </PageShell>
  );
}
