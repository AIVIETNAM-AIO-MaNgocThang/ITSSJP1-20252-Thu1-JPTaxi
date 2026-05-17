import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

const historyItems = [
  { icon: '🕘', name: 'ロッテホテル ハノイ', address: 'ハノイ市バーディン区リエウザイ通り54番地', time: '昨日' },
  { icon: '🕘', name: 'チャンティエンプラザ', address: 'ハノイ市ホアンキエム区ハイバーチュン通り24番地', time: '2日前' },
  { icon: '🕘', name: '日本レストラン 山田', address: 'ハノイ市ドンダー区', time: '先週' },
  { icon: '⭐', name: 'お気に入りの場所', address: '保存した目的地を表示', time: '保存済み' },
];

export default function LocationSearchPage() {
  return (
    <PageShell>
      <main className="location-window">
        <Topbar actions={<><Link to="/home">ホーム</Link><Link to="/user-info">アカウント</Link><img className="topbar-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" /></>} />

        <section className="zip-location-main">
          <section className="zip-location-left">
            <h1>目的地を検索</h1>
            <p>目的地を入力するか、履歴から選択してください。</p>

            <label className="zip-search-box">
              <span>🔍</span>
              <input type="text" placeholder="目的地・住所を入力" />
            </label>

            <section className="zip-route-card">
              <div className="zip-route-points">
                <span className="route-start"></span>
                <span className="route-line"></span>
                <span className="route-end"></span>
              </div>
              <div className="zip-route-fields">
                <div><span>出発地</span><strong>ホアンキエム湖</strong></div>
                <div><span>目的地</span><strong>目的地を選択してください</strong></div>
              </div>
            </section>

            <h2>最近の履歴</h2>
            <div className="zip-history-list">
              {historyItems.map((item) => (
                <Link className="zip-history-item" to="/bill-confirm" key={item.name}>
                  <span className="zip-history-icon">{item.icon}</span>
                  <span className="zip-history-text"><strong>{item.name}</strong><small>{item.address}</small></span>
                  <span className="zip-history-time">{item.time}</span>
                </Link>
              ))}
            </div>

            <Link className="zip-continue-button" to="/bill-confirm">この目的地で続ける</Link>
          </section>

          <aside className="zip-location-map">
            <span className="loc-label label1">ホアンキエム湖</span>
            <span className="loc-label label2">チャンティエンプラザ</span>
            <span className="loc-label label3">ハノイ大教会</span>
            <span className="loc-label label4">クアフエ通り</span>
            <span className="loc-label label5">チャンフンダオ通り</span>
            <span className="loc-pin-start"></span>
            <span className="loc-pin-end"></span>
            <span className="loc-route-path"></span>
            <div className="zip-map-card">
              <strong>ルート情報</strong>
              <div><span>予想所要時間</span><b>12分</b></div>
              <div><span>距離</span><b>4.8 km</b></div>
              <div><span>概算料金</span><b>¥680</b></div>
            </div>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}
