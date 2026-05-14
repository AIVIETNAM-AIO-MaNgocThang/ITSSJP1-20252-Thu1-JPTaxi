import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

export default function UserInfoPage() {
  return (
    <PageShell>
      <main className="app-screen">
        <Topbar />
        <section className="app-shell">
          <div className="profile-header">
            <div>
              <h1>プロフィール設定</h1>
              <p>個人情報、アカウント、セキュリティ設定を管理できます。</p>
            </div>
            <button className="submit-button" type="button">変更を保存</button>
          </div>

          <div className="profile-grid">
            <div>
              <section className="panel identity-panel">
                <button className="avatar-button" type="button">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80" alt="" />
                </button>
                <div>
                  <h2 className="panel-title">個人情報</h2>
                  <div className="form-grid">
                    <label><span>姓</span><input defaultValue="山田" /></label>
                    <label><span>名</span><input defaultValue="太郎" /></label>
                    <label className="field full"><span>メールアドレス</span><input defaultValue="yamada@example.com" /></label>
                    <label><span>性別</span><select defaultValue="Male"><option value="Male">男性</option><option value="Female">女性</option></select></label>
                    <label><span>電話番号</span><input defaultValue="+84 123 456 789" /></label>
                  </div>
                </div>
              </section>

              <section className="panel stack">
                <h2 className="panel-title">通知設定</h2>
                <div className="setting-list">
                  {['配車通知', 'メッセージ通知', 'メール通知'].map((label) => (
                    <label className="setting-row" key={label}>
                      <span className="icon-box">🔔</span>
                      <strong>{label}</strong>
                      <span className="switch"><input type="checkbox" defaultChecked /><span></span></span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <aside>
              <section className="panel">
                <h2 className="panel-title">アカウント情報</h2>
                <div className="setting-list">
                  <button className="account-card" type="button"><strong>表示言語</strong><span>日本語</span></button>
                  <button className="account-card" type="button"><strong>支払い方法</strong><span>クレジットカード **** 4821</span></button>
                  <article className="account-card"><strong>登録日</strong><span>2026年03月10日</span></article>
                </div>
              </section>

              <section className="panel stack">
                <h2 className="panel-title">セキュリティ</h2>
                <div className="setting-list">
                  <button className="account-card" type="button">パスワード変更</button>
                  <button className="account-card" type="button">PINコード変更</button>
                  <button className="account-card" type="button">ログイン履歴</button>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
