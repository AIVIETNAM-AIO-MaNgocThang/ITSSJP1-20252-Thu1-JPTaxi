import { Link } from 'react-router-dom';
import InteractiveRouteMap from '../components/InteractiveRouteMap.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

const userHome = {
  brandTo: '/home',
  actions: (
    <>
      <Link to="/home">ホーム</Link>
      <Link to="/user-info">アカウント</Link>
      <img className="topbar-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" />
    </>
  ),
  heading: 'こんにちは！',
  question: 'どこへ行きますか?',
  searchTo: '/location-search',
  searchTitle: 'どこへ行きますか？',
  searchCopy: '目的地・住所を入力、または履歴から選択',
  quickItems: [
    { icon: '🕒', title: '職場', copy: '123 Duong ABC' },
    { icon: '🏠', title: '自宅', copy: '456 Duong XYZ' },
    { icon: '⭐', title: 'お気に', copy: 'もっと見る', to: '/location-search' },
  ],
  fastTo: '/location-search',
  fastTitle: '今すぐタクシーを呼ぶ',
  fastCopy: 'すぐに予約',
};

const driverHome = {
  brandTo: '/driver-home',
  actions: (
    <>
      <Link to="/driver-home">ホーム</Link>
      <Link to="/driver-info/basic">ドライバー情報</Link>
      <img className="topbar-avatar" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" alt="" />
    </>
  ),
  heading: 'こんにちは！',
  question: '次の配車を確認しますか?',
  searchTo: '/xacnhancuocxe',
  searchTitle: '予約内容を確認',
  searchCopy: '乗車場所・目的地・料金を確認して受付へ進む',
  quickItems: [
    { icon: '👤', title: 'プロフィール', copy: '公開情報を編集', to: '/driver-info/basic' },
    { icon: '💬', title: 'チャット', copy: '利用者へ連絡', to: '/messages/customer' },
    { icon: '📍', title: '待機状況', copy: '時間と距離を表示', to: '/driver-ride-status' },
  ],
  fastTo: '/xacnhancuocxe',
  fastTitle: '配車確認へ進む',
  fastCopy: '確認後、チャット・待機状況・請求書へ',
};

export default function HomeExperience({ mode = 'user' }) {
  const content = mode === 'driver' ? driverHome : userHome;

  return (
    <PageShell>
      <main className="home-window">
        <Topbar brandTo={content.brandTo} actions={content.actions} />

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
            <h1>{content.heading}</h1>
            <p className="zip-home-question">{content.question}</p>

            <Link className="zip-search-card" to={content.searchTo}>
              <span className="zip-search-icon" aria-hidden="true">📍</span>
              <span>
                <strong>{content.searchTitle}</strong>
                <small>{content.searchCopy}</small>
              </span>
            </Link>

            <div className="zip-quick-row">
              {content.quickItems.map((item) => {
                const body = (
                  <>
                    <span>{item.icon}</span>
                    <div><strong>{item.title}</strong><small>{item.copy}</small></div>
                  </>
                );

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

            <Link className="zip-fast-button" to={content.fastTo}>
              <span aria-hidden="true">🚖</span>
              <span><strong>{content.fastTitle}</strong><small>{content.fastCopy}</small></span>
            </Link>
          </div>

          <span className="home-car car-main">🚗</span>
          <span className="home-car car-1">🚘</span>
          <span className="home-car car-2">🚘</span>
          <span className="home-car car-3">🚘</span>
          <span className="home-car car-4">🚘</span>
          <div className="zip-zoom" aria-hidden="true"><button type="button">+</button><button type="button">−</button></div>
        </section>
      </main>
    </PageShell>
  );
}
