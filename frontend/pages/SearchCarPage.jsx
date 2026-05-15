import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/search-car.css';

export default function SearchCarPage() {
  return (
    <PageShell>
      <main className="search-screen">
        <Topbar>
          <div className="location-chip" aria-label="現在位置">
            <span className="location-dot"></span>
            <span>ハノイ・ホアンキエム周辺</span>
          </div>
        </Topbar>

        <section className="map-stage" aria-label="配車マップ">
          <div className="taxi-live taxi-one" aria-hidden="true">🚖</div>
          <div className="taxi-live taxi-two" aria-hidden="true">🚖</div>
          <div className="taxi-live taxi-three" aria-hidden="true">🚖</div>

          <div className="radar-center" aria-hidden="true">
            <div className="pulse"></div>
            <div className="pulse"></div>
            <div className="pulse"></div>
            <div className="user-pin"><span>📍</span></div>
          </div>

          <section className="status-card" aria-labelledby="search-title">
            <div className="status-info">
              <div className="spinner" aria-hidden="true"></div>
              <div className="text-group">
                <h1 id="search-title">タクシーを呼び出し中</h1>
                <p>近くに <strong>3台</strong> の車両が見つかりました。ドライバーの応答を待っています。</p>
              </div>
            </div>

            <div className="card-actions">
              <Link className="secondary-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/home">
                キャンセル
              </Link>
              <Link className="submit-button" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }} to="/ride-status">
                ドライバー確認へ
              </Link>
            </div>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
