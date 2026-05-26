import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';
import { useLanguage } from '../context/LanguageContext.jsx';
import { estimateStraightLineDistanceMeters, getRouteDistanceStatus } from '../utils/routePlanner.js';

const demoMapLocation = {
  latitude: 21.02878,
  longitude: 105.85204,
};

const savedPlaces = [
  { icon: '履歴', name: 'ロッテホテル ハノイ', address: '54 Liễu Giai, Ba Đình, Hà Nội', time: '昨日', position: [21.03205, 105.81283] },
  { icon: '履歴', name: 'チャンティエンプラザ', address: '24 Hai Bà Trưng, Hoàn Kiếm, Hà Nội', time: '2日前', position: [21.02482, 105.85672] },
  { icon: '履歴', name: '日本レストラン 山田', address: 'Đống Đa, Hà Nội', time: '先週', position: [21.01878, 105.82914] },
  { icon: '保存', name: 'ノイバイ国際空港', address: 'Phú Minh, Sóc Sơn, Hà Nội', time: '保存済み', position: [21.21871, 105.80417] },
  { icon: '履歴', name: 'Viettel', address: 'Hoàng Quốc Việt, Nghĩa Đô, Hà Nội', time: '最近', position: [21.04618, 105.78931] },
  { icon: '履歴', name: 'Cầu Giấy', address: 'Hà Nội', time: '最近', position: [21.03594, 105.79464] },
];

const savedPlaceKey = (place) => place.id ?? `${place.name}-${place.address}`;

function readPendingDestination() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem('jpTaxiPendingDestination') || 'null');

    if (!stored || !Array.isArray(stored.position)) {
      return null;
    }

    return {
      icon: stored.icon || '保存',
      id: stored.id || `pending-${stored.name}`,
      name: stored.name,
      address: stored.address,
      position: stored.position,
      query: stored.query || stored.address || stored.name,
    };
  } catch {
    return null;
  }
}

function toPlace(result) {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const displayParts = String(result.display_name ?? '').split(',').map((part) => part.trim()).filter(Boolean);
  const namedetails = result.namedetails ?? {};
  const japaneseName = namedetails['name:ja'] || namedetails['official_name:ja'] || namedetails['alt_name:ja'];
  const primaryName = japaneseName || result.name || displayParts[0] || '目的地';

  return {
    icon: '候補',
    id: `${result.osm_type}-${result.osm_id}`,
    name: primaryName,
    address: displayParts.slice(1, 4).join(', ') || result.display_name || '住所情報なし',
    position: [latitude, longitude],
  };
}

function formatDuration(seconds, meters = 0) {
  const baseMinutes = Math.max(1, Math.round(seconds / 60));
  const distanceKm = Math.max(0, meters / 1000);
  const trafficBufferMinutes = Math.max(3, Math.round(distanceKm * 1.2));

  return `${baseMinutes + trafficBufferMinutes}分`;
}

function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}

function estimateFare(meters) {
  const km = meters / 1000;
  return `¥${Math.max(680, Math.round((420 + km * 85) / 10) * 10)}`;
}

export default function LocationSearchPage() {
  const { t } = useLanguage();
  const [pendingDestination] = useState(readPendingDestination);
  const [pickupQuery, setPickupQuery] = useState('');
  const [query, setQuery] = useState(pendingDestination?.query ?? '');
  const [activeField, setActiveField] = useState(null);
  const [currentPickup, setCurrentPickup] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(pendingDestination);
  const [routePath, setRoutePath] = useState([]);
  const [routeMetrics, setRouteMetrics] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [hiddenHistoryKeys, setHiddenHistoryKeys] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [locationError, setLocationError] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    function closeSuggestions(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
        setSearchError('');
        setActiveField(null);
      }
    }

    document.addEventListener('pointerdown', closeSuggestions);
    return () => document.removeEventListener('pointerdown', closeSuggestions);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setSelectedPickup(null);
      setLocationError(t('enableLocation'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPickup = {
          id: 'current-location',
          icon: '現在',
          name: t('currentLocation'),
          address: t('currentLocation'),
          position: [position.coords.latitude, position.coords.longitude],
        };

        setCurrentPickup(nextPickup);
        setLocationError('');
      },
      () => {
        setCurrentPickup(null);
        setSelectedPickup(null);
        setLocationError(t('enableLocation'));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  }, [t]);

  useEffect(() => {
    if (!activeField) {
      setSuggestions([]);
      setSearchError('');
      setIsSearching(false);
      return undefined;
    }

    const text = (activeField === 'pickup' ? pickupQuery : query).trim();
    const selectedPlace = activeField === 'pickup' ? selectedPickup : selectedDestination;
    const selectedText = selectedPlace?.query || selectedPlace?.name || '';

    if (selectedPlace && text !== selectedText && text !== selectedPlace.name) {
      if (activeField === 'pickup') {
        setSelectedPickup(null);
      } else {
        setSelectedDestination(null);
      }

      setRoutePath([]);
      setRouteMetrics(null);
      window.sessionStorage.removeItem('jpTaxiSelectedRoute');
    }

    if (text.length < 2 || selectedPlace?.name === text) {
      setSuggestions([]);
      setSearchError('');
      setIsSearching(false);
      return undefined;
    }

    const localMatches = savedPlaces.filter((place) => {
      const haystack = `${place.name} ${place.address}`.toLowerCase();
      return haystack.includes(text.toLowerCase());
    });

    setSuggestions(localMatches);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      setSearchError('');

      const params = new URLSearchParams({
        'accept-language': 'ja,vi;q=0.8,en;q=0.6',
        format: 'json',
        limit: '6',
        addressdetails: '1',
        namedetails: '1',
        q: text,
      });

      fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('search failed');
          }

          return response.json();
        })
        .then((items) => {
          const nextSuggestions = items.map(toPlace).filter(Boolean);
          const mergedSuggestions = nextSuggestions.length ? nextSuggestions : localMatches;
          setSuggestions(mergedSuggestions);
          setSearchError(mergedSuggestions.length ? '' : '該当する場所が見つかりませんでした。');
        })
        .catch((error) => {
          if (error.name === 'AbortError') return;

          setSuggestions(localMatches);
          setSearchError(localMatches.length ? '' : '検索に失敗しました。もう一度入力してください。');
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeField, pickupQuery, query, selectedDestination, selectedPickup]);

  useEffect(() => {
    if (!selectedDestination || !selectedPickup) {
      setRoutePath([]);
      setRouteMetrics(null);
      window.sessionStorage.removeItem('jpTaxiSelectedRoute');
      return undefined;
    }

    const controller = new AbortController();
    const [pickupLat, pickupLng] = selectedPickup.position;
    const [destinationLat, destinationLng] = selectedDestination.position;
    const directDistanceMeters = estimateStraightLineDistanceMeters(selectedPickup.position, selectedDestination.position);
    const directDistanceStatus = getRouteDistanceStatus(directDistanceMeters);

    if (directDistanceStatus.isTooFar) {
      setRoutePath([selectedPickup.position, selectedDestination.position]);
      setRouteMetrics({
        distance: formatDistance(directDistanceMeters),
        distanceMeters: directDistanceMeters,
        duration: '--',
        fare: '--',
        isLongDistance: false,
        isTooFar: true,
      });
      setIsRouting(false);
      return undefined;
    }

    const url = [
      'https://router.project-osrm.org/route/v1/driving',
      `${pickupLng},${pickupLat};${destinationLng},${destinationLat}`,
    ].join('/');
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'true',
    });

    setIsRouting(true);
    fetch(`${url}?${params.toString()}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error('route failed');
        }

        return response.json();
      })
      .then((data) => {
        const route = data?.routes?.[0];
        const coordinates = route?.geometry?.coordinates ?? [];
        const nextPath = coordinates.map(([lng, lat]) => [lat, lng]);
        const distanceMeters = Number(route?.distance ?? 0);
        const routeDistanceStatus = getRouteDistanceStatus(distanceMeters);

        setRoutePath(nextPath.length ? nextPath : [selectedPickup.position, selectedDestination.position]);
        setRouteMetrics({
          distance: formatDistance(distanceMeters),
          distanceMeters,
          duration: formatDuration(route?.duration ?? 0, distanceMeters),
          fare: estimateFare(distanceMeters),
          isLongDistance: routeDistanceStatus.isLongDistance,
          isTooFar: routeDistanceStatus.isTooFar,
        });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;

        setRoutePath([selectedPickup.position, selectedDestination.position]);
        setRouteMetrics({
          distance: t('calculating'),
          duration: t('calculating'),
          fare: t('calculating'),
          isLongDistance: false,
          isTooFar: false,
        });
      })
      .finally(() => {
        setIsRouting(false);
      });

    return () => {
      controller.abort();
    };
  }, [selectedDestination, selectedPickup, t]);

  useEffect(() => {
    if (!selectedDestination || !routeMetrics || !selectedPickup) {
      return;
    }

    window.sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify({
      destination: selectedDestination,
      pickup: {
        name: selectedPickup.name,
        address: selectedPickup.address,
        position: selectedPickup.position,
      },
      routePath,
      routeMetrics,
    }));
    window.sessionStorage.removeItem('jpTaxiPendingDestination');
  }, [routeMetrics, routePath, selectedDestination, selectedPickup]);

  const mapCenter = useMemo(
    () => selectedPickup?.position ?? [demoMapLocation.latitude, demoMapLocation.longitude],
    [selectedPickup],
  );

  const routePoints = useMemo(() => {
    if (!selectedDestination || !selectedPickup) {
      return [];
    }

    return [
      {
        key: 'pickup',
        label: selectedPickup.name,
        meta: t('pickupPoint'),
        time: t('now'),
        position: selectedPickup.position,
        type: 'pickup',
      },
      {
        key: 'destination',
        label: selectedDestination.name,
        meta: selectedDestination.address,
        time: routeMetrics?.duration ? `約${routeMetrics.duration}` : '',
        position: selectedDestination.position,
        type: 'destination',
      },
    ];
  }, [routeMetrics?.duration, selectedDestination, selectedPickup, t]);

  const visiblePlaces = savedPlaces.filter((place) => !hiddenHistoryKeys.includes(savedPlaceKey(place)));
  const activeQuery = activeField === 'pickup' ? pickupQuery : query;
  const activeSelectedPlace = activeField === 'pickup' ? selectedPickup : selectedDestination;
  const showInlineSuggestions = activeField === 'pickup'
    ? Boolean(currentPickup || activeQuery.trim().length >= 2)
    : Boolean(activeField)
      && activeQuery.trim().length >= 2
      && activeSelectedPlace?.name !== activeQuery.trim();
  const showHistory = !showInlineSuggestions && !selectedDestination;
  const canContinue = Boolean(
    selectedDestination
    && selectedPickup
    && routeMetrics
    && !routeMetrics.isTooFar
    && !isRouting,
  );

  function selectDestination(place) {
    window.sessionStorage.removeItem('jpTaxiPendingDestination');
    setSelectedDestination(place);
    setQuery(place.name);
    setSuggestions([]);
    setSearchError('');
    setActiveField(null);
  }

  function selectSearchResult(place) {
    if (activeField === 'pickup') {
      setSelectedPickup(place);
      setPickupQuery(place.name);
    } else {
      selectDestination(place);
      return;
    }

    setSuggestions([]);
    setSearchError('');
    setActiveField(null);
  }

  function selectCurrentPickup() {
    if (!currentPickup) return;

    setSelectedPickup(currentPickup);
    setPickupQuery(t('currentLocation'));
    setSuggestions([]);
    setSearchError('');
    setActiveField(null);
  }

  function handleDeleteHistory(event, place) {
    event.stopPropagation();
    setHiddenHistoryKeys((current) => [...current, savedPlaceKey(place)]);
  }

  function renderSuggestions(field) {
    if (!showInlineSuggestions || activeField !== field) return null;

    return (
      <div className="zip-inline-suggestions">
        {field === 'pickup' && currentPickup ? (
          <button className="zip-suggestion-item current-location-suggestion" onClick={selectCurrentPickup} type="button">
            <span className="zip-history-icon">現在</span>
            <span className="zip-history-text">
              <strong>{t('currentLocation')}</strong>
              <small>{currentPickup.address}</small>
            </span>
          </button>
        ) : null}
        {field === 'pickup' && !currentPickup ? (
          <div className="zip-search-state">{locationError || t('enableLocation')}</div>
        ) : null}
        {isSearching ? <div className="zip-search-state">検索しています...</div> : null}
        {!isSearching && searchError ? <div className="zip-search-state">{searchError}</div> : null}
        {!isSearching && suggestions.map((item) => (
          <button className="zip-suggestion-item" key={savedPlaceKey(item)} onClick={() => selectSearchResult(item)} type="button">
            <span className="zip-history-icon">{item.icon}</span>
            <span className="zip-history-text">
              <strong>{item.name}</strong>
              <small>{item.address}</small>
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <PageShell>
      <main className="location-window">
        <Topbar
          actions={(
            <>
              <Link to="/home">{t('navHome')}</Link>
              <Link to="/user-info">{t('navAccount')}</Link>
              <img className="topbar-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" />
            </>
          )}
        />

        <section className="zip-location-main">
          <section className="zip-location-left">
            <h1>{t('locationSearchTitle')}</h1>
            <p>{t('locationSearchCopy')}</p>

            <div className="zip-search-stack" ref={searchRef}>
              <div className="zip-search-field">
                <span className="zip-field-label">{t('pickupPoint')}</span>
                <label className={`zip-search-box ${activeField === 'pickup' ? 'active' : ''}`}>
                  <input
                    autoComplete="off"
                    onChange={(event) => {
                      setActiveField('pickup');
                      setPickupQuery(event.target.value);
                    }}
                    onFocus={() => setActiveField('pickup')}
                    placeholder={t('currentLocation')}
                    type="text"
                    value={pickupQuery}
                  />
                </label>
                {renderSuggestions('pickup')}
              </div>

              <div className="zip-search-field">
                <span className="zip-field-label">{t('destination')}</span>
                <label className={`zip-search-box ${activeField === 'destination' ? 'active' : ''}`}>
                  <input
                    autoComplete="off"
                    onChange={(event) => {
                      setActiveField('destination');
                      setQuery(event.target.value);
                    }}
                    onFocus={() => setActiveField('destination')}
                    placeholder={t('destinationPlaceholder')}
                    type="text"
                    value={query}
                  />
                </label>
                {renderSuggestions('destination')}
              </div>
            </div>

            <section className="zip-route-card">
              <div className="zip-route-points">
                <span className="route-start"></span>
                <span className="route-line"></span>
                <span className="route-end"></span>
              </div>
              <div className="zip-route-fields">
                <div>
                  <span>{t('pickupPoint')}</span>
                  <strong>{selectedPickup?.name ?? t('locationUnavailable')}</strong>
                </div>
                <div>
                  <span>{t('destination')}</span>
                  <strong>{selectedDestination?.name ?? t('destinationPlaceholder')}</strong>
                </div>
              </div>
            </section>

            {!selectedPickup && <div className="location-warning">{locationError || t('enableLocation')}</div>}

            <div className={`zip-location-results ${showHistory ? '' : 'collapsed'}`}>
              {showHistory && <h2>{t('recentHistory')}</h2>}
              <div className="zip-history-list">
                {showHistory && visiblePlaces.map((item) => (
                  <button className="zip-history-item" key={savedPlaceKey(item)} onClick={() => selectDestination(item)} type="button">
                    <span className="zip-history-icon">{item.icon}</span>
                    <span className="zip-history-text">
                      <strong>{item.name}</strong>
                      <small>{item.address}</small>
                    </span>
                    <span className="zip-history-time">{item.time ?? '選択'}</span>
                    <span
                      aria-label={t('deleteHistory')}
                      className="zip-history-delete"
                      onClick={(event) => handleDeleteHistory(event, item)}
                      role="button"
                      tabIndex={0}
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="zip-location-actions">
              <Link className="flow-back-link" to="/home">{t('back')}</Link>
              <Link
                aria-disabled={!canContinue}
                className={`zip-continue-button ${canContinue ? '' : 'disabled'}`}
                onClick={(event) => {
                  if (!canContinue) {
                    event.preventDefault();
                    setSearchError(t('invalidDestination'));
                  }
                }}
                to={canContinue ? '/bill-confirm' : '#'}
              >
                {t('continueWithDestination')}
              </Link>
            </div>
          </section>

          <aside className="zip-location-map">
            <InteractiveRouteMap
              alternateRoutePath={[]}
              className="location-search-route-map"
              currentLocation={selectedPickup?.position ?? null}
              fitToRoute={Boolean(selectedDestination && selectedPickup)}
              interactive
              mapCenter={mapCenter}
              mapZoom={15}
              route={routePoints}
              routePath={routePath}
              routeSummary={routeMetrics ? `${routeMetrics.distance} - ${routeMetrics.duration}` : null}
              scrollWheelZoom
              showControls
              showCurrentLocation={!selectedDestination && Boolean(selectedPickup)}
              showDetails={false}
              showDriver={false}
              showMarkers={Boolean(selectedDestination && selectedPickup)}
              showRoute={Boolean(selectedDestination && selectedPickup)}
            />
            <div className="zip-map-card">
              <strong>{t('routeInfo')}</strong>
              <div><span>{t('duration')}</span><b>{isRouting ? t('calculating') : routeMetrics?.duration ?? '--'}</b></div>
              <div><span>{t('distance')}</span><b>{isRouting ? t('calculating') : routeMetrics?.distance ?? '--'}</b></div>
              <div><span>{t('totalFare')}</span><b>{isRouting ? t('calculating') : routeMetrics?.fare ?? '--'}</b></div>
              {routeMetrics?.isLongDistance && <p className="route-distance-warning">{t('routeLongWarning')}</p>}
              {routeMetrics?.isTooFar && <p className="route-distance-warning danger">{t('routeTooFarWarning')}</p>}
            </div>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}
