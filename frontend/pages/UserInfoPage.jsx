import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getCustomerProfile } from '../api/auth.js';
import { fetchCustomerProfile, updateCustomerProfile } from '../api/customers.js';
import { ApiError } from '../api/client.js';
import { uploadAvatar } from '../api/uploads.js';
import Modal from '../components/Modal.jsx';
import ProfileAvatarSlot from '../components/ProfileAvatarSlot.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  isCustomerRole,
} from '../utils/session.js';
import { resolveUploadUrl } from '../utils/uploadUrl.js';
import '../styles/app-pages.css';
import { readSavedPlaces, writeSavedPlaces } from '../utils/savedPlaces.js';

const userMenu = [
  { id: 'profile', icon: '👤', label: 'プロフィール', to: '/user-info/profile' },
  { id: 'security', icon: '🔒', label: 'セキュリティ', to: '/user-info/security' },
  { id: 'notifications', icon: '🔔', label: '通知設定', to: '/user-info/notifications' },
  { id: 'payment', icon: '💳', label: '支払い方法', to: '/user-info/payment' },
  { id: 'language', icon: '🌐', label: '言語設定', to: '/user-info/language' },
  { id: 'logout', icon: '🚪', label: 'ログアウト', to: '/user-info/logout' },
];

export default function UserInfoPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = userMenu.some((item) => item.id === section) ? section : 'profile';
  const [modal, setModal] = useState(null);
  const [savedPlaces, setSavedPlaces] = useState(readSavedPlaces);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!avatarPreviewUrl) {
      return undefined;
    }
    return () => {
      URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true });
      return;
    }
    if (!isCustomerRole()) {
      navigate('/driver-home', { replace: true });
      return;
    }
    async function loadProfile() {
      const storedId = getStoredUser()?.customerId;
      try {
        if (storedId != null) {
          setProfile(await fetchCustomerProfile(storedId));
          return;
        }
        const fromAuth = await getCustomerProfile();
        setProfile(fromAuth);
        if (fromAuth?.customerId != null) {
          setProfile(await fetchCustomerProfile(fromAuth.customerId));
        }
      } catch {
        clearAuthSession();
        navigate('/login', { replace: true });
      }
    }
    loadProfile();
  }, [navigate]);

  function handleLogout() {
    clearAuthSession();
    navigate('/login', { replace: true });
  }

  function resolveCustomerId() {
    return profile?.customerId ?? getStoredUser()?.customerId ?? null;
  }

  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    setProfileError('');
    setAvatarPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function closeAvatarModal() {
    setModal(null);
    setAvatarFile(null);
    setAvatarPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    setProfileError('');
  }

  async function handleAvatarUpload() {
    const customerId = resolveCustomerId();
    if (!avatarFile || !profile || customerId == null) return;
    setAvatarUploading(true);
    setProfileError('');
    try {
      const uploaded = await uploadAvatar(avatarFile);
      const updated = await updateCustomerProfile(customerId, {
        lastName: profile.lastName,
        firstName: profile.firstName,
        gender: profile.gender,
        birthDate: profile.birthDate,
        phone: profile.phone,
        email: profile.email,
        avatarUrl: uploaded.url,
      });
      const merged = {
        ...profile,
        ...updated,
        customerId: updated.customerId ?? customerId,
        avatarUrl: updated.avatarUrl ?? uploaded.url,
      };
      setProfile(merged);
      setAvatarVersion(Date.now());
      setAvatarFile(null);
      setAvatarPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      setModal(null);
    } catch (err) {
      setProfileError(
        err instanceof ApiError ? err.message : '画像のアップロードに失敗しました。',
      );
    } finally {
      setAvatarUploading(false);
    }
  }

  const displayName = profile
    ? `${profile.lastName} ${profile.firstName}`
    : '—';
  /** Ảnh hiển thị tại ô #1 (sidebar) — ưu tiên preview khi đang chọn file */
  const sidebarAvatarSrc = useMemo(() => {
    if (avatarPreviewUrl) {
      return avatarPreviewUrl;
    }
    return resolveUploadUrl(profile?.avatarUrl, avatarVersion || null);
  }, [avatarPreviewUrl, profile?.avatarUrl, avatarVersion]);

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

  function updateSavedPlace(key, value) {
    setSavedPlaces((current) => ({
      ...current,
      [key]: {
        ...current[key],
        address: value,
      },
    }));
  }

  function saveProfile() {
    writeSavedPlaces(savedPlaces);
    setModal('saved');
  }

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
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
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
          <button className="submit-button profile-save-button" type="button" onClick={handleLogout}>ログアウト</button>
        </section>
      );
    }

    return (
      <div className="profile-reference-grid">
        <div>
          <section className="panel zip-profile-panel">
            <h2 className="panel-title">個人情報</h2>
            <div className="form-grid">
              <label><span>姓</span><input key={`ln-${profile?.customerId}`} defaultValue={profile?.lastName ?? ''} readOnly /></label>
              <label><span>名</span><input key={`fn-${profile?.customerId}`} defaultValue={profile?.firstName ?? ''} readOnly /></label>
              <label className="field full"><span>メールアドレス</span><input key={`em-${profile?.customerId}`} defaultValue={profile?.email ?? ''} readOnly /></label>
              <label><span>性別</span><input key={`gd-${profile?.customerId}`} defaultValue={profile?.gender ?? ''} readOnly /></label>
              <label><span>電話番号</span><input key={`ph-${profile?.customerId}`} defaultValue={profile?.phone ?? ''} readOnly /></label>
              <label className="field full"><span>生年月日</span><input key={`bd-${profile?.customerId}`} defaultValue={profile?.birthDate ?? ''} readOnly /></label>
            </div>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">クイック住所</h2>
            <div className="saved-address-grid">
              {Object.entries(savedPlaces).map(([key, place]) => (
                <label className="saved-address-row" key={key}>
                  <span className="saved-address-icon">{place.icon}</span>
                  <span>
                    <strong>{place.title}</strong>
                    <input
                      onChange={(event) => updateSavedPlace(key, event.target.value)}
                      placeholder={`${place.title}の住所を入力`}
                      value={place.address}
                    />
                  </span>
                </label>
              ))}
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
              <button className="account-card" type="button" onClick={() => setModal('account')}><strong>ログインアカウント</strong><span>{profile?.email ?? '—'}</span></button>
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
          <Topbar actions={<><Link to="/home">ホーム</Link><Link to="/messages/driver">メッセージ</Link><ProfileAvatarSlot slot="topbar" src={sidebarAvatarSrc} fallbackText={displayName} /></>} />
          <section className="profile-page-shell zip-profile-shell">
            <aside className="profile-sidebar">
              <section className="profile-card zip-profile-card">
                <ProfileAvatarSlot
                  slot="1"
                  src={sidebarAvatarSrc}
                  fallbackText={displayName}
                />
                <strong>{displayName}</strong>
                <span>{profile?.email ?? '—'}</span>
                <em>一般ユーザー</em>
                <button className="link-btn" type="button" onClick={() => setModal('avatar')}>画像を変更</button>
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
                <button className="submit-button profile-save-button" type="button" onClick={saveProfile}>変更を保存</button>
              </div>
              {renderContent()}
            </section>
          </section>
        </div>

        <Modal
          open={Boolean(modal)}
          title={modalTitle || '保存しました'}
          onClose={() => (modal === 'avatar' ? closeAvatarModal() : setModal(null))}
        >
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
          {modal === 'avatar' && (
            <div className="modal-form zip-modal-form">
              <ProfileAvatarSlot
                slot="preview"
                src={sidebarAvatarSrc}
                fallbackText={displayName}
              />
              <label>
                <span>画像ファイル（JPEG / PNG / WebP、5MB以下）</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFileChange}
                />
              </label>
              <span className="field-error" aria-live="polite">{profileError}</span>
              <button
                className="submit-button profile-save-button"
                type="button"
                disabled={!avatarFile || avatarUploading}
                onClick={handleAvatarUpload}
              >
                {avatarUploading ? 'アップロード中...' : 'アップロード'}
              </button>
            </div>
          )}
          {modal === 'logout' && (
            <>
              <p className="modal-copy">ログアウトしますか？</p>
              <button className="submit-button profile-save-button" type="button" onClick={handleLogout}>
                ログアウト
              </button>
            </>
          )}
          {modal && !['account', 'password', 'loginHistory', 'avatar', 'logout'].includes(modal) && (
            <p className="modal-copy">内容を確認して保存してください。</p>
          )}
        </Modal>
      </main>
    </PageShell>
  );
}
