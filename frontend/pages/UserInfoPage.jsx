import { Link, NavLink, useParams } from 'react-router-dom';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

const userMenu = [
  { id: 'profile', icon: '👤', label: 'プロフィール', to: '/user-info/profile' },
  { id: 'security', icon: '🔒', label: 'セキュリティ', to: '/user-info/security' },
  { id: 'notifications', icon: '🔔', label: '通知設定', to: '/user-info/notifications' },
  { id: 'payment', icon: '💳', label: '支払い方法', to: '/user-info/payment' },
  { id: 'language', icon: '🌐', label: '言語設定', to: '/user-info/language' },
  { id: 'logout', icon: '🚪', label: 'ログアウト', to: '/user-info/logout' },
];

export default function UserInfoPage() {
  const { section } = useParams();
  const activeSection = userMenu.some((item) => item.id === section) ? section : 'profile';
  const [modal, setModal] = useState(null);

  const modalTitle = {
    account: 'アカウント情報を編集',
    avatar: 'プロフィール画像を変更',
    password: 'パスワード変更',
    loginHistory: 'ログイン履歴',
    card: 'カード情報',
    addCard: 'カードを追加',
    logout: 'ログアウト確認',
    saved: '保存しました',
  }[modal];

  function renderContent() {
    if (activeSection === 'security') {
      return (
        <section className="panel zip-profile-panel">
          <h2 className="panel-title">セキュリティ</h2>
          <div className="security-list">
            <article className="security-item">
              <strong>パスワード変更</strong>
              <span>アカウント保護のため、定期的にパスワードを更新してください。</span>
              <button className="link-btn" type="button" onClick={() => setModal('password')}>変更する</button>
            </article>
            <article className="security-item">
              <strong>アカウント情報</strong>
              <span>ログインID、メール、電話番号などの基本アカウント情報を編集します。</span>
              <button className="link-btn" type="button" onClick={() => setModal('account')}>編集する</button>
            </article>
            <article className="security-item">
              <strong>ログイン履歴</strong>
              <span>最近ログインした端末と日時を確認できます。</span>
              <button className="link-btn" type="button" onClick={() => setModal('loginHistory')}>確認する</button>
            </article>
          </div>
        </section>
      );
    }

    if (activeSection === 'notifications') {
      return (
        <section className="panel zip-profile-panel">
          <h2 className="panel-title">通知設定</h2>
          <div className="setting-list">
            {[
              ['🔔', '配車通知', '予約確認や到着予定などの通知を受け取る'],
              ['💬', 'メッセージ通知', 'ドライバーやサポートからの連絡を受け取る'],
              ['📧', 'メール通知', 'キャンペーンやお知らせをメールで受け取る'],
            ].map(([icon, title, sub]) => (
              <label className="setting-row" key={title}>
                <span className="icon-box">{icon}</span>
                <span>
                  <strong>{title}</strong>
                  <small>{sub}</small>
                </span>
                <span className="switch"><input type="checkbox" defaultChecked /><span></span></span>
              </label>
            ))}
          </div>
        </section>
      );
    }

    if (activeSection === 'payment') {
      return (
        <section className="panel zip-profile-panel narrow-panel">
          <h2 className="panel-title">支払い方法</h2>
          <div className="setting-list">
            <button className="account-card" type="button" onClick={() => setModal('card')}>
              <strong>既定の支払い方法</strong>
              <span>クレジットカード **** 4821</span>
            </button>
            <button className="submit-button profile-save-button" type="button" onClick={() => setModal('addCard')}>カードを追加</button>
          </div>
        </section>
      );
    }

    if (activeSection === 'language') {
      return (
        <section className="panel zip-profile-panel narrow-panel">
          <h2 className="panel-title">言語設定</h2>
          <label>
            <span>表示言語</span>
            <select defaultValue="ja">
              <option value="ja">日本語</option>
              <option value="vi">ベトナム語</option>
              <option value="en">英語</option>
            </select>
          </label>
        </section>
      );
    }

    if (activeSection === 'logout') {
      return (
        <section className="panel zip-profile-panel narrow-panel">
          <h2 className="panel-title">ログアウト</h2>
          <p className="muted-copy">現在のアカウントからログアウトします。</p>
          <button className="submit-button profile-save-button" type="button" onClick={() => setModal('logout')}>ログアウト</button>
        </section>
      );
    }

    return (
      <div className="profile-reference-grid">
        <div>
          <section className="panel zip-profile-panel">
            <h2 className="panel-title">個人情報</h2>
            <div className="form-grid">
              <label><span>姓</span><input defaultValue="山田" /></label>
              <label><span>名</span><input defaultValue="太郎" /></label>
              <label className="field full"><span>メールアドレス</span><input defaultValue="yamada@example.com" /></label>
              <label><span>性別</span><select defaultValue="male"><option value="male">男性</option><option value="female">女性</option></select></label>
              <label><span>電話番号</span><input defaultValue="+84 123 456 789" /></label>
              <label className="field full"><span>住所</span><input defaultValue="ハノイ市バーディン区" /></label>
            </div>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">通知設定</h2>
            <div className="setting-list">
              {[
                ['🔔', '配車通知', '予約確認や到着予定などの通知を受け取る'],
                ['💬', 'メッセージ通知', 'ドライバーやサポートからの連絡を受け取る'],
                ['📧', 'メール通知', 'キャンペーンやお知らせをメールで受け取る'],
              ].map(([icon, title, sub]) => (
                <label className="setting-row" key={title}>
                  <span className="icon-box">{icon}</span>
                  <span><strong>{title}</strong><small>{sub}</small></span>
                  <span className="switch"><input type="checkbox" defaultChecked /><span></span></span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div>
          <section className="panel zip-profile-panel">
            <h2 className="panel-title">アカウント情報</h2>
            <div className="setting-list">
              <button className="account-card" type="button" onClick={() => setModal('account')}><strong>ログインアカウント</strong><span>yamada@example.com</span></button>
              <Link className="account-card" to="/user-info/language"><strong>表示言語</strong><span>日本語</span></Link>
              <Link className="account-card" to="/user-info/payment"><strong>支払い方法</strong><span>カード **** 4821</span></Link>
              <article className="account-card"><strong>登録日</strong><span>2026年03月10日</span></article>
            </div>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">セキュリティ</h2>
            <div className="security-list">
              <article className="security-item">
                <strong>パスワード変更</strong>
                <span>アカウントの安全性を高めるため、定期的にパスワードを変更してください。</span>
                <button className="link-btn" type="button" onClick={() => setModal('password')}>変更する</button>
              </article>
              <article className="security-item">
                <strong>二段階認証</strong>
                <span>ログイン時に追加の確認コードを要求して、セキュリティを強化します。</span>
                <button className="link-btn" type="button" onClick={() => setModal('twoFactor')}>設定する</button>
              </article>
              <article className="security-item">
                <strong>ログイン履歴</strong>
                <span>最近のログイン履歴や利用端末を確認できます。</span>
                <button className="link-btn" type="button" onClick={() => setModal('loginHistory')}>確認する</button>
              </article>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <main className="app-screen zip-profile-screen">
        <div className="profile-window">
          <Topbar actions={<><Link to="/home">ホーム</Link><Link to="/messages/driver">メッセージ</Link><img className="topbar-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" /></>} />
          <section className="profile-page-shell zip-profile-shell">
            <aside className="profile-sidebar">
              <section className="profile-card zip-profile-card">
                <div className="profile-avatar">山</div>
                <strong>山田 太郎</strong>
                <span>yamada@example.com</span>
                <em>一般ユーザー</em>
              </section>
              <nav className="side-menu" aria-label="プロフィールメニュー">
                {userMenu.map((tab) => (
                  <NavLink className={({ isActive }) => `side-item ${isActive || activeSection === tab.id ? 'active' : ''}`} to={tab.to} key={tab.id}>
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </NavLink>
                ))}
              </nav>
            </aside>

            <section className="profile-content">
              <div className="profile-header zip-profile-header">
                <div>
                  <h1>プロフィール設定</h1>
                  <p>個人情報やアカウント設定を管理できます。必要に応じて内容を更新してください。</p>
                </div>
                <button className="submit-button profile-save-button" type="button" onClick={() => setModal('saved')}>変更を保存</button>
              </div>
              {renderContent()}
            </section>
          </section>
        </div>

        <Modal open={Boolean(modal)} title={modalTitle || '保存しました'} onClose={() => setModal(null)}>
          {modal === 'account' && (
            <div className="modal-form zip-modal-form">
              <label><span>ログインID</span><input defaultValue="yamada_taro" /></label>
              <label><span>メールアドレス</span><input type="email" defaultValue="yamada@example.com" /></label>
              <label><span>電話番号</span><input defaultValue="+84 123 456 789" /></label>
              <label><span>表示名</span><input defaultValue="山田 太郎" /></label>
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal(null)}>保存</button>
            </div>
          )}
          {modal === 'password' && (
            <div className="modal-form zip-modal-form">
              <label><span>現在のパスワード</span><input type="password" /></label>
              <label><span>新しいパスワード</span><input type="password" /></label>
              <label><span>新しいパスワード確認</span><input type="password" /></label>
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal(null)}>保存</button>
            </div>
          )}
          {modal === 'loginHistory' && <div className="modal-list"><span>2026/05/14 21:30 - Chrome / Windows</span><span>2026/05/12 08:15 - Mobile Safari</span></div>}
          {modal && !['account', 'password', 'loginHistory'].includes(modal) && <p className="modal-copy">内容を確認して保存してください。</p>}
        </Modal>
      </main>
    </PageShell>
  );
}
