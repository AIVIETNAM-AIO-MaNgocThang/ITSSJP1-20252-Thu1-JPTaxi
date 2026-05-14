import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

const destinations = [
  { icon: '🏨', title: 'ハノイ旧市街ホテル', meta: 'Hoan Kiem - 約12分' },
  { icon: '✈️', title: 'ノイバイ国際空港', meta: '高速道路利用 - 約38分' },
  { icon: '🏛️', title: 'ホアンキエム湖', meta: '観光スポット - 約8分' },
  { icon: '🏢', title: 'VNU 工科大学', meta: 'Cau Giay - 約22分' },
];

export default function LocationSearchPage() {
  return (
    <PageShell>
      <main className="app-screen">
        <Topbar />
        <section className="app-shell">
          <div className="profile-header">
            <div>
              <h1>目的地を検索</h1>
              <p>乗車地と目的地を選んで、タクシー予約へ進みます。</p>
            </div>
            <Link className="secondary-button" style={{ width: 160 }} to="/home">戻る</Link>
          </div>

          <div className="two-column-layout">
            <section className="panel">
              <h2 className="panel-title">ルート情報</h2>
              <div className="form-grid">
                <label className="field full">
                  <span>現在地</span>
                  <input value="ハノイ・ホアンキエム周辺" readOnly />
                </label>
                <label className="field full">
                  <span>目的地</span>
                  <input placeholder="ホテル、駅、住所を入力" />
                </label>
              </div>

              <h2 className="panel-title stack">おすすめ</h2>
              <div className="search-list">
                {destinations.map((item) => (
                  <Link className="search-result" to="/bill-confirm" key={item.title}>
                    <span className="icon-box" aria-hidden="true">{item.icon}</span>
                    <span>
                      <strong>{item.title}</strong>
                      <span className="muted-small">{item.meta}</span>
                    </span>
                    <strong>選択</strong>
                  </Link>
                ))}
              </div>
            </section>

            <aside className="panel">
              <h2 className="panel-title">予約の流れ</h2>
              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-dot">1</span>
                  <div><strong>目的地検索</strong><span className="muted-small">候補から行き先を選択</span></div>
                </div>
                <div className="timeline-item pending">
                  <span className="timeline-dot">2</span>
                  <div><strong>料金確認</strong><span className="muted-small">車種と支払い方法を確認</span></div>
                </div>
                <div className="timeline-item pending">
                  <span className="timeline-dot">3</span>
                  <div><strong>配車</strong><span className="muted-small">近くのドライバーを検索</span></div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
