import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function HomePage() {
  return (
    <PageShell>
      <main className="app-screen">
        <Topbar />
        <section className="app-shell">
          <div className="hero-home">
            <div className="home-panel">
              <h1>こんにちは！</h1>
              <p>どこへ行きますか？目的地を選んで、JP TAXIでスムーズに移動しましょう。</p>

              <Link className="destination-card" to="/location-search" style={{ textDecoration: 'none' }}>
                <span aria-hidden="true">📍</span>
                <div>
                  <strong>どこへ行きますか？</strong>
                  <span>目的地・住所を入力、または履歴から選択</span>
                </div>
              </Link>

              <div className="quick-grid">
                <article className="quick-card">
                  <strong>🕒 職場</strong>
                  <span>123 Duong ABC</span>
                </article>
                <article className="quick-card">
                  <strong>🏠 自宅</strong>
                  <span>456 Duong XYZ</span>
                </article>
                <Link className="quick-card" to="/advance-booking" style={{ textDecoration: 'none' }}>
                  <strong>⭐ 予約</strong>
                  <span>日時を指定する</span>
                </Link>
              </div>

              <Link className="fast-book-button" to="/search-car">
                <span aria-hidden="true">🚖</span>
                <span>
                  <strong>今すぐタクシーを呼ぶ</strong>
                  <span>すぐに予約</span>
                </span>
              </Link>
            </div>

            <span className="map-chip one">Hoan Kiem Lake</span>
            <span className="map-chip two">Trang Tien Plaza</span>
            <span className="map-chip three">Tran Hung Dao</span>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
