import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDriverProfile, resolveAssetUrl } from '../api/accounts.js';
import { acceptDriverRide, getPendingDriverRide, updateDriverLocation } from '../api/rides.js';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { calculateFareBreakdown, formatYen } from '../utils/fare.js';
import { DEFAULT_MAP_LOCATION, watchBrowserLocation } from '../utils/geolocation.js';
import { fetchDrivingRoute, formatDistance as formatRouteDistance, formatDuration, hasDrivingRoutePath } from '../utils/routePlanner.js';
import '../styles/app-pages.css';

const defaultDriverLocation = {
  lat: DEFAULT_MAP_LOCATION.latitude,
  lng: DEFAULT_MAP_LOCATION.longitude,
};

const driverFallbackAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';
const customerFallbackAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';

function formatPickupDistance(value, t) {
  const distance = Number(value);
  if (!Number.isFinite(distance)) return t('withinTwoKm');
  return `${distance.toFixed(1)} km`;
}

function buildSelectedRoute(request, routePreview, t) {
  return {
    destination: {
      name: request.dropoffAddress,
      address: request.dropoffAddress,
      position: [request.dropoffLat, request.dropoffLng],
    },
    pickup: {
      name: request.pickupAddress,
      position: [request.pickupLat, request.pickupLng],
    },
    routeMetrics: {
      duration: routePreview?.duration ?? t('calculatingRoute'),
      distance: routePreview?.distance ?? formatPickupDistance(request.distanceKm, t),
      fare: formatYen(calculateFareBreakdown(request.distanceKm).totalJpy),
    },
    routePath: hasDrivingRoutePath(routePreview?.routePath) ? routePreview.routePath : [],
    passenger: {
      customerId: request.customerId,
      name: request.actualPassengerName || request.customer?.name || `KH-${request.customerId}`,
      phone: request.actualPassengerPhone || request.customer?.phone || '',
      avatarUrl: request.customer?.avatarUrl || request.customer?.avatar_url || null,
    },
  };
}

export default function DriverDispatchPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [pendingRide, setPendingRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routePreview, setRoutePreview] = useState(null);
  const [topbarAvatar, setTopbarAvatar] = useState(() => (
    resolveAssetUrl(localStorage.getItem('jpTaxiDriverAvatarUrl')) || driverFallbackAvatar
  ));
  const [message, setMessage] = useState(() => t('dispatchSearchMessage'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    let ignore = false;

    function syncStoredAvatar() {
      setTopbarAvatar(resolveAssetUrl(localStorage.getItem('jpTaxiDriverAvatarUrl')) || driverFallbackAvatar);
    }

    syncStoredAvatar();
    getDriverProfile()
      .then((profile) => {
        if (ignore) return;
        const avatar = resolveAssetUrl(profile?.avatarUrl);
        if (avatar) {
          localStorage.setItem('jpTaxiDriverAvatarUrl', avatar);
          setTopbarAvatar(avatar);
        }
      })
      .catch(() => {
        if (!ignore) syncStoredAvatar();
      });

    window.addEventListener('storage', syncStoredAvatar);
    window.addEventListener('focus', syncStoredAvatar);

    return () => {
      ignore = true;
      window.removeEventListener('storage', syncStoredAvatar);
      window.removeEventListener('focus', syncStoredAvatar);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadPendingRide() {
      try {
        const result = await getPendingDriverRide();
        if (ignore) return;
        setPendingRide(result?.request ?? null);
        setMessage(result?.request ? '' : (result?.message || t('dispatchSearchMessage')));
      } catch (error) {
        if (!ignore) {
          setPendingRide(null);
          setMessage(error.message || t('noMatchingRideRequest'));
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    const stopWatching = watchBrowserLocation(
      (location) => {
        if (ignore || location.isFallback) return;
        const nextLocation = { lat: location.latitude, lng: location.longitude };
        setDriverLocation(nextLocation);
        updateDriverLocation(nextLocation).catch(() => {
          /* keep the map usable when location syncing is temporarily unavailable */
        });
      },
      { fallback: DEFAULT_MAP_LOCATION, emitFallback: false },
    );

    loadPendingRide();
    const timer = window.setInterval(loadPendingRide, 2500);
    return () => {
      ignore = true;
      stopWatching();
      window.clearInterval(timer);
    };
  }, [t]);

  useEffect(() => {
    if (!pendingRide) {
      setRoutePreview(null);
      return undefined;
    }

    const controller = new AbortController();
    fetchDrivingRoute(
      [pendingRide.pickupLat, pendingRide.pickupLng],
      [pendingRide.dropoffLat, pendingRide.dropoffLng],
      { signal: controller.signal },
    )
      .then((route) => setRoutePreview({
        routePath: route.routePath,
        distance: formatRouteDistance(route.distance),
        duration: formatDuration(route.duration, route.distance),
      }))
      .catch((error) => {
        if (error.name !== 'AbortError') setRoutePreview(null);
      });

    return () => controller.abort();
  }, [pendingRide]);

  const passengerName = useMemo(() => {
    if (!pendingRide) return '';
    return pendingRide.actualPassengerName || pendingRide.customer?.name || `KH-${pendingRide.customerId}`;
  }, [pendingRide]);

  const passengerPhone = pendingRide?.actualPassengerPhone || pendingRide?.customer?.phone || '';
  const passengerAvatar = resolveAssetUrl(pendingRide?.customer?.avatarUrl || pendingRide?.customer?.avatar_url) || customerFallbackAvatar;
  const routePoints = pendingRide ? [
    ...(driverLocation ? [{
      key: 'driver',
      label: t('driverLocationLabel'),
      meta: t('now'),
      position: [driverLocation.lat, driverLocation.lng],
      type: 'driver',
    }] : []),
    {
      key: 'pickup',
      label: pendingRide.pickupAddress,
      meta: t('pickupMeta'),
      position: [pendingRide.pickupLat, pendingRide.pickupLng],
      type: 'pickup',
    },
    {
      key: 'destination',
      label: pendingRide.dropoffAddress,
      meta: t('destinationMeta'),
      position: [pendingRide.dropoffLat, pendingRide.dropoffLng],
      type: 'destination',
    },
  ] : [];
  const mapCenter = pendingRide
    ? [pendingRide.pickupLat, pendingRide.pickupLng]
    : [driverLocation?.lat ?? defaultDriverLocation.lat, driverLocation?.lng ?? defaultDriverLocation.lng];
  const routePath = pendingRide ? routePreview?.routePath ?? [] : [];
  const hasRoutePreview = hasDrivingRoutePath(routePath);

  async function handleAccept() {
    if (!pendingRide || isAccepting) return;
    if (!driverLocation) {
      setMessage(t('enableLocation'));
      return;
    }
    setIsAccepting(true);
    try {
      const result = await acceptDriverRide(pendingRide.requestId);
      const acceptedTripId = result?.tripId ?? result?.trip?.tripId;
      sessionStorage.setItem('jpTaxiRideRequestId', String(pendingRide.requestId));
      if (acceptedTripId) {
        sessionStorage.setItem('jpTaxiTripId', String(acceptedTripId));
      }
      sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify(buildSelectedRoute(pendingRide, routePreview, t)));
      localStorage.setItem('jpTaxiRideAccepted', JSON.stringify({
        requestId: pendingRide.requestId,
        tripId: acceptedTripId,
        acceptedAt: Date.now(),
      }));
      navigate('/driver-ride-status');
    } catch (error) {
      setMessage(error.message || t('acceptRideFailed'));
      setPendingRide(null);
      setIsAccepting(false);
    }
  }

  return (
    <PageShell>
      <main className="driver-dispatch-screen driver-dispatch-reference">
        <Topbar
          brandTo="/driver-home"
          actions={(
            <>
              <Link to="/driver-home">{t('navHome')}</Link>
              <Link to="/messages/customer">{t('notificationsShort')}</Link>
              <img className="topbar-avatar driver-avatar-top" src={topbarAvatar} alt="" />
            </>
          )}
        />

        <section className="driver-dispatch-main">
          <div className="driver-dispatch-left">
            <h1>{t('dispatchConfirmTitle')}</h1>
            <p>{t('dispatchConfirmCopy')}</p>

            <div className="dispatch-driver-box">
              <img src={topbarAvatar} alt="" />
              <div>
                <strong>{t('driverOnline')}</strong>
                <span>{driverLocation ? `${t('serviceRange')}: 2 km` : t('enableLocation')}</span>
              </div>
            </div>

            {pendingRide ? (
              <>
                <section className="dispatch-card">
                  <div className="dispatch-countdown">2km</div>
                  <span>{t('toPickupPoint')}</span>
                  <strong>{formatPickupDistance(pendingRide.distanceKm, t)}</strong>
                  <div className="dispatch-actions">
                    <Link className="dispatch-decline" to="/driver-home">{t('skip')}</Link>
                    <button className="dispatch-accept" type="button" onClick={handleAccept} disabled={isAccepting || !driverLocation}>
                      {isAccepting ? t('accepting') : t('accept')}
                    </button>
                  </div>
                </section>
                {!driverLocation ? <p className="muted-copy">{t('enableLocation')}</p> : null}

                <section className="dispatch-customer-card">
                  <p>{t('customerInfo')}</p>
                  <div>
                    <span>
                      <strong>{passengerName}</strong>
                      <em>{passengerPhone || t('phoneUnregistered')}</em>
                    </span>
                  </div>
                </section>
              </>
            ) : (
              <section className="dispatch-empty-card">
                <div className="spinner" aria-hidden="true"></div>
                <h2>{isLoading ? t('loading') : t('searchingRideRequests')}</h2>
                <p>{message}</p>
              </section>
            )}
          </div>

          <div className="driver-dispatch-map">
            <InteractiveRouteMap
              alternateRoutePath={[]}
              className="dispatch-route-map"
              currentLocation={driverLocation ? [driverLocation.lat, driverLocation.lng] : mapCenter}
              fitToRoute={Boolean(pendingRide)}
              interactive
              mapCenter={mapCenter}
              mapZoom={15}
              route={routePoints}
              routePath={routePath}
              routeSummary={pendingRide ? `${routePreview?.distance ?? formatPickupDistance(pendingRide.distanceKm, t)} - ${routePreview?.duration ?? t('calculatingRoute')}` : null}
              scrollWheelZoom
              showControls
              showCurrentLocation={Boolean(driverLocation)}
              showDetails={false}
              showDriver={false}
              showMarkers={Boolean(pendingRide)}
              showRoute={hasRoutePreview}
            />
            {pendingRide ? (
              <>
                <span className="dispatch-map-label pickup">{pendingRide.pickupAddress}</span>
                <span className="dispatch-map-label drop">{pendingRide.dropoffAddress}</span>
                <section className="dispatch-floating-details">
                  <div className="dispatch-passenger-row">
                    {passengerAvatar ? <img src={passengerAvatar} alt={passengerName} /> : <span>KH</span>}
                    <div>
                      <strong>{t('customerLabel')}: {passengerName}</strong>
                      <small>{passengerPhone || t('checkingContact')}</small>
                    </div>
                  </div>
                  <div className="dispatch-stats">
                    <article><span>{t('pickupShort')}</span><strong>{formatPickupDistance(pendingRide.distanceKm, t)}</strong></article>
                    <article><span>{t('range')}</span><strong>2 km</strong></article>
                    <article><span>{t('status')}</span><strong>{t('newStatus')}</strong></article>
                  </div>
                </section>
              </>
            ) : (
              <section className="dispatch-floating-details dispatch-waiting-details">
                <div className="dispatch-passenger-row">
                  <span>...</span>
                  <div>
                    <strong>{t('searchingNearbyCustomers')}</strong>
                    <small>{t('noSampleWithoutRequests')}</small>
                  </div>
                </div>
              </section>
            )}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
