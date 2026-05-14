import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function DriverInfoPage() {
  return (
    <PageShell>
      <main className="app-screen">
        <Topbar />
        <section className="app-shell driver-layout">
          <aside className="driver-sidebar">
            <section className="panel">
              <div className="driver-avatar-large">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80" alt="" />
              </div>
              <h2 className="panel-title">山田 太郎</h2>
              <span className="driver-badge">公式ドライバー</span>
            </section>
            <button className="driver-side-card" type="button">基本情報</button>
            <button className="driver-side-card" type="button">車両・免許情報</button>
            <button className="driver-side-card" type="button">稼働履歴</button>
            <button className="driver-side-card" type="button">支払い・銀行振込</button>
          </aside>

          <div>
            <div className="profile-header">
              <div>
                <h1>ドライバープロフィール</h1>
                <p>基本情報、車両、稼働履歴、振込先を管理します。</p>
              </div>
              <button className="submit-button" type="button">保存</button>
            </div>

            <div className="profile-grid">
              <section className="panel">
                <h2 className="panel-title">基本情報</h2>
                <div className="form-grid">
                  <label><span>氏名</span><input defaultValue="山田 太郎" /></label>
                  <label><span>国籍</span><input defaultValue="Japan" /></label>
                  <label><span>電話番号</span><input defaultValue="+84 123 456 789" /></label>
                  <label><span>メール</span><input defaultValue="yamada.driver@example.com" /></label>
                  <label><span>日本語レベル</span><select defaultValue="N3"><option>N5</option><option>N4</option><option>N3</option><option>N2</option></select></label>
                  <label><span>生年月日</span><input type="date" /></label>
                </div>
              </section>

              <aside>
                <section className="panel">
                  <h2 className="panel-title">登録車両情報</h2>
                  <div className="setting-list">
                    <article className="account-card"><strong>Toyota Crown</strong><span>30A-123.45 / White</span></article>
                    <article className="account-card"><strong>座席</strong><span>4人乗り</span></article>
                  </div>
                </section>
                <section className="panel stack">
                  <h2 className="panel-title">本人確認・書類状況</h2>
                  <div className="setting-list">
                    <article className="account-card"><strong>運転免許証</strong><span>確認済み</span></article>
                    <article className="account-card"><strong>車検証</strong><span>確認済み</span></article>
                  </div>
                </section>
              </aside>
            </div>

            <section className="panel stack">
              <h2 className="panel-title">稼働履歴</h2>
              <div className="trip-summary">
                <article><span>本日の乗車</span><strong>8件</strong></article>
                <article><span>評価</span><strong>4.9</strong></article>
                <article><span>売上</span><strong>¥12,800</strong></article>
              </div>
            </section>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
