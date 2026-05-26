import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getDriverMyProfile } from '../api/drivers.js';
import { getDriverRatings } from '../api/ratings.js';
import Modal from '../components/Modal.jsx';
import ProfileAvatarSlot from '../components/ProfileAvatarSlot.jsx';
import { clearAuthSession, getAuthToken, isDriverRole } from '../utils/session.js';
import { resolveUploadUrl } from '../utils/uploadUrl.js';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

const driverMenu = [
  { id: 'basic', icon: '👤', label: 'プロフィール設定', to: '/driver-info/basic' },
  { id: 'vehicle', icon: '🚗', label: '車両・免許情報', to: '/driver-info/vehicle' },
  { id: 'history', icon: '📈', label: '稼働履歴', to: '/driver-info/history' },
  { id: 'reviews', icon: '⭐', label: '評価・コメント', to: '/driver-info/reviews' },
  { id: 'payout', icon: '💰', label: 'お支払い・振込', to: '/driver-info/payout' },
  { id: 'logout', icon: '🚪', label: 'ログアウト', to: '/driver-info/logout' },
];

export default function DriverInfoPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = driverMenu.some((item) => item.id === section) ? section : 'basic';
  const [online, setOnline] = useState(true);
  const [modal, setModal] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true });
      return;
    }
    if (!isDriverRole()) {
      navigate('/home', { replace: true });
      return;
    }
    getDriverMyProfile()
      .then(setProfile)
      .catch(() => {
        clearAuthSession();
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  useEffect(() => {
    if (!getAuthToken() || !isDriverRole()) return;
    if (activeSection === 'history' || activeSection === 'reviews') {
      getDriverRatings({ limit: 15 })
        .then(setRatingsData)
        .catch(() => setRatingsData(null));
    }
  }, [activeSection]);

  function formatTripDate(iso) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  function renderRatingStars(score) {
    return '★'.repeat(score) + '☆'.repeat(Math.max(0, 5 - score));
  }

  function renderReviewsList() {
    if (!ratingsData?.items?.length) {
      return <p className="muted-copy">まだ評価がありません。</p>;
    }
    return (
      <div className="driver-rating-list">
        {ratingsData.items.map((item) => (
          <article className="driver-rating-item" key={item.ratingId}>
            <header>
              <strong>{item.customerName || 'お客様'}</strong>
              <span className="rating-stars-inline">{renderRatingStars(item.score)}</span>
            </header>
            {item.tags?.length > 0 && (
              <div className="driver-rating-tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
            {item.comment && <p>{item.comment}</p>}
            <small className="muted-copy">{formatTripDate(item.createdAt)}</small>
          </article>
        ))}
      </div>
    );
  }

  function handleLogout() {
    clearAuthSession();
    navigate('/login', { replace: true });
  }

  const displayName = profile
    ? `${profile.lastName ?? ''} ${profile.firstName ?? ''}`.trim()
    : '—';
  const avatarSrc = resolveUploadUrl(profile?.avatarUrl);

  const modalTitle = {
    account: 'アカウント情報を編集',
    vehicle: '車両情報を追加',
    password: 'パスワード変更',
    saved: '保存しました',
  }[modal] || '詳細設定';

  function renderTab() {
    if (activeSection === 'vehicle') {
      return (
        <div className="profile-grid">
          <section className="panel zip-profile-panel">
            <h2 className="panel-title">登録車両情報</h2>
            <div className="driver-info-card">
              <span>🚗</span>
              <div>
                <strong>Toyota Vios <small>(白)</small></strong>
                <p>ナンバープレート: 30A-123.45 / 座席数: 4</p>
              </div>
              <em>認証済み</em>
            </div>
            <div className="vehicle-actions">
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal('vehicle')}>車両を追加</button>
              <button className="secondary-button profile-save-button" type="button" onClick={() => setModal('vehicle')}>編集</button>
            </div>
          </section>

          <aside className="panel zip-profile-panel">
            <h2 className="panel-title">本人確認・書類状況</h2>
            <div className="license-preview-card">
              <span className="license-preview-title">運転免許証</span>
              <div className="license-preview-frame">
                <span>LICENSE IMAGE</span>
              </div>
            </div>
            <div className="doc-list">
              <button type="button" onClick={() => setModal('license')}>運転免許証 <strong>承認済み</strong></button>
              <button type="button" onClick={() => setModal('inspection')}>車検証 <strong>承認済み</strong></button>
              <button className="warning" type="button" onClick={() => setModal('insurance')}>任意保険証 <strong>更新が必要</strong></button>
            </div>
          </aside>
        </div>
      );
    }

    if (activeSection === 'history') {
      const completedTrips = profile?.trips?.filter((t) => t.status === 'completed') ?? [];
      const avgLabel =
        ratingsData?.averageScore != null ? ratingsData.averageScore.toFixed(1) : '—';
      return (
        <section className="panel zip-profile-panel">
          <h2 className="panel-title">稼働履歴</h2>
          <div className="trip-summary">
            <article><span>完了乗車</span><strong>{completedTrips.length}件</strong></article>
            <article><span>評価</span><strong>{avgLabel}</strong></article>
            <article>
              <span>レビュー</span>
              <strong>{ratingsData?.ratingCount ?? '—'}</strong>
            </article>
          </div>
          <div className="modal-list history-list">
            {completedTrips.slice(0, 8).map((trip, index) => (
              <span key={`${trip.startTime}-${index}`}>
                {formatTripDate(trip.startTime)} {trip.pickupAddress} → {trip.dropoffAddress} / ¥
                {trip.finalFareJpy}
              </span>
            ))}
            {completedTrips.length === 0 && <span>履歴がありません</span>}
          </div>
        </section>
      );
    }

    if (activeSection === 'reviews') {
      return (
        <section className="panel zip-profile-panel">
          <h2 className="panel-title">評価・コメント</h2>
          <div className="trip-summary">
            <article>
              <span>平均評価</span>
              <strong>
                {ratingsData?.averageScore != null ? ratingsData.averageScore.toFixed(2) : '—'}
              </strong>
            </article>
            <article>
              <span>レビュー数</span>
              <strong>{ratingsData?.ratingCount ?? '—'}</strong>
            </article>
          </div>
          {renderReviewsList()}
        </section>
      );
    }

    if (activeSection === 'payout') {
      return (
        <section className="panel zip-profile-panel narrow-panel">
          <h2 className="panel-title">お支払い・振込</h2>
          <div className="setting-list">
            <article className="account-card"><strong>今週の振込予定</strong><span>¥48,500</span></article>
            <button className="account-card" type="button" onClick={() => setModal('bank')}><strong>振込先銀行</strong><span>Vietcombank **** 0291</span></button>
            <button className="submit-button profile-save-button" type="button" onClick={() => setModal('payout')}>明細を見る</button>
          </div>
        </section>
      );
    }

    if (activeSection === 'logout') {
      return (
        <section className="panel zip-profile-panel narrow-panel">
          <h2 className="panel-title">ログアウト</h2>
          <p className="muted-copy">ドライバーアカウントからログアウトします。</p>
          <button className="submit-button profile-save-button" type="button" onClick={handleLogout}>ログアウト</button>
        </section>
      );
    }

    return (
      <div className="driver-reference-grid">
        <div>
          <label className="status-toggle">
            <span>
              <strong>{online ? '現在オンライン' : '現在オフライン'}</strong>
              <small>{online ? '配車リクエストを受け取れる状態です' : '配車リクエストを停止しています'}</small>
            </span>
            <span className="switch"><input type="checkbox" checked={online} onChange={(event) => setOnline(event.target.checked)} /><span></span></span>
          </label>

          <section className="panel zip-profile-panel">
            <h2 className="panel-title">基本情報</h2>
            <div className="form-grid">
              <label><span>氏名</span><input defaultValue="山田 太郎 (Taro Yamada)" /></label>
              <label><span>電話番号</span><input defaultValue="+84 123 456 789" /></label>
              <label><span>対応言語</span><input defaultValue="日本語, 英語" /></label>
              <label><span>メールアドレス</span><input defaultValue="yamada.driver@example.com" /></label>
            </div>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">登録車両情報</h2>
            <div className="driver-info-card">
              <span>🚗</span>
              <div>
                <strong>Toyota Vios <small>(白)</small></strong>
                <p>ナンバープレート: 30A-123.45 • 座席数: 4</p>
              </div>
              <em>✓ 認証済み</em>
            </div>
          </section>
        </div>

        <div>
          <section className="panel zip-profile-panel">
            <h2 className="panel-title">本人確認・書類状況</h2>
            <div className="doc-list">
              <button type="button" onClick={() => setModal('license')}>🪪 運転免許証 <strong>承認済み</strong></button>
              <button type="button" onClick={() => setModal('inspection')}>📘 車検証 <strong>承認済み</strong></button>
              <button className="warning" type="button" onClick={() => setModal('insurance')}>📋 任意保険証 <strong>更新が必要</strong></button>
            </div>
            <p className="muted-copy">有効期限: 2027年03月10日まで</p>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">アカウント安全</h2>
            <div className="security-list">
              <article className="security-item">
                <strong>パスワード</strong>
                <button className="link-btn" type="button" onClick={() => setModal('password')}>変更する</button>
              </article>
              <article className="security-item">
                <strong>二段階認証</strong>
                <span>有効化されています</span>
                <button className="link-btn" type="button" onClick={() => setModal('twoFactor')}>確認する</button>
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
          <Topbar brandTo="/driver-home" actions={<><Link to="/driver-home">売上管理</Link><Link to="/messages/customer">通知</Link><ProfileAvatarSlot slot="topbar" className="driver-avatar-top" src={avatarSrc} fallbackText={displayName} /></>} />
          <section className="profile-page-shell zip-profile-shell">
            <aside className="profile-sidebar">
              <section className="profile-card zip-profile-card driver-profile-card">
                <ProfileAvatarSlot slot="1" src={avatarSrc} fallbackText={displayName} />
                <strong>{displayName}</strong>
                <span>{profile?.email ?? '—'}</span>
                <em>公式ドライバー</em>
              </section>
              <nav className="side-menu" aria-label="ドライバーメニュー">
                {driverMenu.map((tab) => (
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
                  <h1>ドライバープロフィール</h1>
                  <p>あなたの公開情報と車両設定を管理します。</p>
                </div>
                <button className="submit-button profile-save-button" type="button" onClick={() => setModal('saved')}>情報を更新する</button>
              </div>
              {renderTab()}
            </section>
          </section>
        </div>

        <Modal open={Boolean(modal)} title={modalTitle} onClose={() => setModal(null)}>
          {modal === 'account' && (
            <div className="modal-form zip-modal-form">
              <label><span>ログインID</span><input defaultValue="driver_yamada" /></label>
              <label><span>メールアドレス</span><input type="email" defaultValue="yamada.driver@example.com" /></label>
              <label><span>電話番号</span><input defaultValue="+84 123 456 789" /></label>
              <label><span>表示名</span><input defaultValue="山田 太郎" /></label>
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal(null)}>保存</button>
            </div>
          )}
          {modal === 'vehicle' && (
            <div className="modal-form zip-modal-form">
              <div className="form-grid">
                <label><span>メーカー</span><input defaultValue="Toyota" /></label>
                <label><span>車種</span><input defaultValue="Vios" /></label>
                <label><span>色</span><input defaultValue="White" /></label>
                <label><span>座席数</span><select defaultValue="4"><option value="4">4</option><option value="7">7</option></select></label>
                <label><span>ナンバープレート</span><input defaultValue="30A-123.45" /></label>
                <label><span>車検有効期限</span><input type="date" defaultValue="2027-05-14" /></label>
              </div>
              <label><span>車両メモ</span><textarea defaultValue="禁煙車、空港送迎対応" /></label>
              <div className="license-preview-card">
                <span className="license-preview-title">運転免許証画像</span>
                <div className="license-preview-frame large">
                  <span>画像プレビュー</span>
                </div>
                <input type="file" accept="image/*" />
              </div>
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal(null)}>保存</button>
            </div>
          )}
          {modal === 'password' && (
            <div className="modal-form zip-modal-form">
              <label><span>現在のパスワード</span><input type="password" /></label>
              <label><span>新しいパスワード</span><input type="password" /></label>
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal(null)}>保存</button>
            </div>
          )}
          {modal && !['account', 'vehicle', 'password'].includes(modal) && <p className="modal-copy">選択した項目の詳細確認・編集用ポップアップです。</p>}
        </Modal>
      </main>
    </PageShell>
  );
}
