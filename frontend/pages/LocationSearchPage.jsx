import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

const defaultUserLocation = {
  latitude: 21.02878,
  longitude: 105.85204,
};

const savedPlaces = [
  { icon: '履歴', name: 'ロッテホテル ハノイ', address: '54 Liễu Giai, Ba Đình, Hà Nội', time: '昨日', position: [21.03205, 105.81283] },
  { icon: '履歴', name: 'チャンティエンプラザ', address: '24 Hai Bà Trưng, Hoàn Kiếm, Hà Nội', time: '2日前', position: [21.02482, 105.85672] },
  { icon: '履歴', name: '日本レストラン 山田', address: 'Đống Đa, Hà Nội', time: '先週', position: [21.01878, 105.82914] },
  { icon: '保存', name: 'ノイバイ国際空港', address: 'Phú Minh, Sóc Sơn, Hà Nội', time: '保存済み', position: [21.21871, 105.80417] },
];

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
  const minutes = baseMinutes + trafficBufferMinutes;

  return `${minutes}分`;
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
  const [query, setQuery] = useState('');
  const [userLocation, setUserLocation] = useState(defaultUserLocation);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [routeMetrics, setRouteMetrics] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setUserLocation(defaultUserLocation);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 7000 },
    );
  }, []);

  useEffect(() => {
    const text = query.trim();

    if (text.length < 2) {
      setSuggestions([]);
      setSearchError('');
      setIsSearching(false);
      return undefined;
    }

    if (selectedDestination?.name === text) {
      setSuggestions([]);
      setSearchError('');
      setIsSearching(false);
      return undefined;
    }

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
          setSuggestions(nextSuggestions);
          setSearchError(nextSuggestions.length ? '' : '該当する目的地が見つかりませんでした。');
        })
        .catch((error) => {
          if (error.name === 'AbortError') return;

          const fallback = savedPlaces.filter((place) => {
            const haystack = `${place.name} ${place.address}`.toLowerCase();
            return haystack.includes(text.toLowerCase());
          });

          setSuggestions(fallback);
          setSearchError(fallback.length ? '' : '検索に失敗しました。もう一度入力してください。');
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, selectedDestination?.name]);

  useEffect(() => {
    if (!selectedDestination) {
      setRoutePath([]);
      setRouteMetrics(null);
      window.sessionStorage.removeItem('jpTaxiSelectedRoute');
      return undefined;
    }

    const controller = new AbortController();
    const [destinationLat, destinationLng] = selectedDestination.position;
    const url = [
      'https://router.project-osrm.org/route/v1/driving',
      `${userLocation.longitude},${userLocation.latitude};${destinationLng},${destinationLat}`,
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

        setRoutePath(nextPath.length ? nextPath : [[userLocation.latitude, userLocation.longitude], selectedDestination.position]);
        setRouteMetrics({
          distance: formatDistance(route?.distance ?? 0),
          duration: formatDuration(route?.duration ?? 0, route?.distance ?? 0),
          fare: estimateFare(route?.distance ?? 0),
        });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;

        setRoutePath([[userLocation.latitude, userLocation.longitude], selectedDestination.position]);
        setRouteMetrics({
          distance: '計算中',
          duration: '計算中',
          fare: '計算中',
        });
      })
      .finally(() => {
        setIsRouting(false);
      });

    return () => {
      controller.abort();
    };
  }, [selectedDestination, userLocation.latitude, userLocation.longitude]);

  useEffect(() => {
    if (!selectedDestination || !routeMetrics) {
      return;
    }

    window.sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify({
      destination: selectedDestination,
      pickup: {
        name: '現在位置',
        position: [userLocation.latitude, userLocation.longitude],
      },
      routePath,
      routeMetrics,
    }));
  }, [routeMetrics, routePath, selectedDestination, userLocation.latitude, userLocation.longitude]);

  const mapCenter = useMemo(
    () => [userLocation.latitude, userLocation.longitude],
    [userLocation.latitude, userLocation.longitude],
  );

  const routePoints = useMemo(() => {
    if (!selectedDestination) {
      return [];
    }

    return [
      {
        key: 'pickup',
        label: '現在位置',
        meta: '出発地',
        time: '現在',
        position: mapCenter,
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
  }, [mapCenter, routeMetrics?.duration, selectedDestination]);

  const visiblePlaces = query.trim().length >= 2 ? suggestions : savedPlaces;

  const handleSelectPlace = (place) => {
    setSelectedDestination(place);
    setQuery(place.name);
    setSuggestions([]);
  };

  return (
    <PageShell>
      <main className="location-window">
        <Topbar actions={<><Link to="/home">ホーム</Link><Link to="/user-info">アカウント</Link><img className="topbar-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" /></>} />

        <section className="zip-location-main">
          <section className="zip-location-left">
            <h1>目的地を検索</h1>
            <p>目的地を入力するか、履歴から選択してください。</p>

            <label className="zip-search-box">
              <span>検索</span>
              <input
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="目的地・住所を入力"
                type="text"
                value={query}
              />
            </label>

            <section className="zip-route-card">
              <div className="zip-route-points">
                <span className="route-start"></span>
                <span className="route-line"></span>
                <span className="route-end"></span>
              </div>
              <div className="zip-route-fields">
                <div><span>出発地</span><strong>現在位置</strong></div>
                <div><span>目的地</span><strong>{selectedDestination?.name ?? '目的地を選択してください'}</strong></div>
              </div>
            </section>

            <div className="zip-location-results">
            <h2>{query.trim().length >= 2 ? '検索結果' : '最近の履歴'}</h2>
            <div className="zip-history-list">
              {isSearching ? <div className="zip-search-state">検索しています...</div> : null}
              {!isSearching && searchError ? <div className="zip-search-state">{searchError}</div> : null}
              {!isSearching && visiblePlaces.map((item) => (
                <button className="zip-history-item" key={item.id ?? item.name} onClick={() => handleSelectPlace(item)} type="button">
                  <span className="zip-history-icon">{item.icon}</span>
                  <span className="zip-history-text"><strong>{item.name}</strong><small>{item.address}</small></span>
                  <span className="zip-history-time">{item.time ?? '選択'}</span>
                </button>
              ))}
            </div>

            </div>

            <div className="zip-location-actions">
              <Link className="flow-back-link" to="/home">戻る</Link>
              <Link
                className={`zip-continue-button ${selectedDestination ? '' : 'disabled'}`}
                to={selectedDestination ? '/bill-confirm' : '#'}
              >
                この目的地で続ける
              </Link>
            </div>
          </section>

          <aside className="zip-location-map">
            <InteractiveRouteMap
              alternateRoutePath={[]}
              className="location-search-route-map"
              currentLocation={mapCenter}
              fitToRoute={Boolean(selectedDestination)}
              interactive
              mapCenter={mapCenter}
              mapZoom={15}
              route={routePoints}
              routePath={routePath}
              routeSummary={routeMetrics ? `${routeMetrics.distance} - ${routeMetrics.duration}` : null}
              scrollWheelZoom
              showControls
              showCurrentLocation={!selectedDestination}
              showDetails={false}
              showDriver={false}
              showMarkers={Boolean(selectedDestination)}
              showRoute={Boolean(selectedDestination)}
            />
            <div className="zip-map-card">
              <strong>ルート情報</strong>
              <div><span>予想所要時間</span><b>{isRouting ? '計算中' : routeMetrics?.duration ?? '--'}</b></div>
              <div><span>距離</span><b>{isRouting ? '計算中' : routeMetrics?.distance ?? '--'}</b></div>
              <div><span>概算料金</span><b>{isRouting ? '計算中' : routeMetrics?.fare ?? '--'}</b></div>
            </div>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}
