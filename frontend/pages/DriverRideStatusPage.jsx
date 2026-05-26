import { useState } from 'react';
import { Link } from 'react-router-dom';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { getChatPath } from '../utils/chatSession.js';
import '../styles/app-pages.css';

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
    const pickupPosition = parsedRoute.pickup?.position;
    const destinationPosition = parsedRoute.destination?.position;

    if (!Array.isArray(pickupPosition) || !Array.isArray(destinationPosition)) {
      return fallbackRoute;
    }

    return {
      ...fallbackRoute,
      ...parsedRoute,
      routePath: Array.isArray(parsedRoute.routePath) ? parsedRoute.routePath : fallbackRoute.routePath,
      routeMetrics: {
        ...fallbackRoute.routeMetrics,
        ...parsedRoute.routeMetrics,
      },
    };
  } catch {
    return fallbackRoute;
  }
}

export default function DriverRideStatusPage() {
  const [selectedRoute] = useState(readSelectedRoute);
  const routePoints = [
    {
      key: 'pickup',
      label: selectedRoute.pickup.name,
      meta: '乗車地',
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

  return (
    <PageShell>
      <main className="driver-tracking-screen">
        <Topbar
          brandTo="/driver-home"
          actions={(
            <>
              <Link to="/driver-home">ホーム</Link>
              <Link to={getChatPath('customer')}>メッセージ</Link>
              <Link to="/driver-info/basic">アカウント</Link>
            </>
          )}
        />

        <section className="driver-tracking-map">
          <InteractiveRouteMap
            alternateRoutePath={[]}
            className="tracking-route-map"
            compact
            currentLocation={selectedRoute.pickup.position}
            route={routePoints}
            routePath={selectedRoute.routePath}
            routeSummary={`${selectedRoute.routeMetrics.distance} - ${selectedRoute.routeMetrics.duration}`}
            scrollWheelZoom
            showCurrentLocation={false}
            showDetails={false}
          />

          <section className="driver-tracking-card">
            <div className="tracking-eta-header">
              <div>
                <span>到着予定時間</span>
                <strong>あと {selectedRoute.routeMetrics.duration}</strong>
              </div>
              <em>{selectedRoute.routeMetrics.distance}</em>
            </div>

            <div className="tracking-passenger-row">
              <span>👤</span>
              <div>
                <strong>JPTX-9821 様</strong>
                <small>{selectedRoute.pickup.name}で待機中</small>
                <em>090-1234-5678</em>
              </div>
            </div>

            <div className="tracking-actions">
              <Link className="tracking-call" to={getChatPath('customer')}>💬 連絡する</Link>
              <Link className="tracking-message" to="/driver-invoice">📄 請求書へ</Link>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
