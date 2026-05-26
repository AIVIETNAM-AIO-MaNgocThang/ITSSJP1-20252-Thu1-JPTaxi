import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { readSavedPlaces, writeSavedPlaces } from '../utils/savedPlaces.js';
import '../styles/app-pages.css';

const userMenu = [
  { id: 'profile', icon: '👤', labelKey: 'profile', to: '/user-info/profile' },
  { id: 'security', icon: '🔒', labelKey: 'security', to: '/user-info/security' },
  { id: 'notifications', icon: '🔔', labelKey: 'notifications', to: '/user-info/notifications' },
  { id: 'payment', icon: '💳', labelKey: 'paymentMethod', to: '/user-info/payment' },
  { id: 'language', icon: '🌐', labelKey: 'languageSettings', to: '/user-info/language' },
  { id: 'logout', icon: '🚪', labelKey: 'logout', to: '/user-info/logout' },
];

const savedPlaceTitleKeys = {
  work: 'quickWork',
  home: 'quickHome',
  favorite: 'quickFavorite',
};

export default function UserInfoPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const activeSection = userMenu.some((item) => item.id === section) ? section : 'profile';
  const [modal, setModal] = useState(null);
  const [savedPlaces, setSavedPlaces] = useState(readSavedPlaces);

  const modalTitles = {
    account: t('changeAccountInfo'),
    avatar: t('changeAvatar'),
    password: t('passwordChange'),
    loginHistory: t('loginHistory'),
    card: t('cardInfo'),
    addCard: t('addCard'),
    logout: t('logoutQuestion'),
    saved: t('saved'),
  };
  const modalTitle = modalTitles[modal];

  function closeModal() {
    setModal(null);
  }

  function confirmLogout() {
    localStorage.removeItem('jpTaxiRole');
    localStorage.removeItem('jpTaxiLoginEmail');
    navigate('/login', { replace: true });
  }

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

  function renderNotificationSettings() {
    return (
      <div className="setting-list">
        {[
          ['🔔', t('dispatchNotification'), t('dispatchNotificationCopy')],
          ['💬', t('messageNotification'), t('messageNotificationCopy')],
          ['📧', t('emailNotification'), t('emailNotificationCopy')],
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
    );
  }

  function renderSecuritySettings(compact = false) {
    return (
      <div className="security-list">
        <article className="security-item">
          <strong>{t('passwordChange')}</strong>
          <span>{t('passwordSecurityCopy')}</span>
          <button className="link-btn" type="button" onClick={() => setModal('password')}>{t('change')}</button>
        </article>
        {compact ? (
          <article className="security-item">
            <strong>{t('twoFactor')}</strong>
            <span>{t('twoFactorCopy')}</span>
            <button className="link-btn" type="button" onClick={() => setModal('twoFactor')}>{t('configure')}</button>
          </article>
        ) : (
          <article className="security-item">
            <strong>{t('accountInfo')}</strong>
            <span>{t('accountEditCopy')}</span>
            <button className="link-btn" type="button" onClick={() => setModal('account')}>{t('edit')}</button>
          </article>
        )}
        <article className="security-item">
          <strong>{t('loginHistory')}</strong>
          <span>{t('loginHistoryCopy')}</span>
          <button className="link-btn" type="button" onClick={() => setModal('loginHistory')}>{t('check')}</button>
        </article>
      </div>
    );
  }

  function renderPaymentPanel() {
    return (
      <div className="profile-settings-grid">
        <section className="panel zip-profile-panel settings-primary-panel">
          <div className="settings-panel-heading">
            <span className="settings-panel-icon">💳</span>
            <div>
              <h2 className="panel-title">{t('paymentMethod')}</h2>
              <p>{t('paymentPageCopy')}</p>
            </div>
          </div>
          <button className="payment-profile-card" type="button" onClick={() => setModal('card')}>
            <span className="payment-card-brand">JP</span>
            <span>
              <strong>{t('activeCard')}</strong>
              <small>Credit Card **** 4821</small>
            </span>
            <em>{t('expires')} 08/28</em>
          </button>
          <button className="submit-button settings-wide-button" type="button" onClick={() => setModal('addCard')}>{t('addCard')}</button>
        </section>

        <section className="panel zip-profile-panel settings-side-panel">
          <span className="settings-panel-icon">🔒</span>
          <h2 className="panel-title">{t('billingSecurity')}</h2>
          <p className="muted-copy">{t('billingSecurityCopy')}</p>
          <div className="settings-status-pill">{t('savedInBrowser')}</div>
        </section>
      </div>
    );
  }

  function renderLanguagePanel() {
    return (
      <div className="profile-settings-grid">
        <section className="panel zip-profile-panel settings-primary-panel">
          <div className="settings-panel-heading">
            <span className="settings-panel-icon">🌐</span>
            <div>
              <h2 className="panel-title">{t('languageSettings')}</h2>
              <p>{t('languagePageCopy')}</p>
            </div>
          </div>
          <div className="language-choice-list" role="radiogroup" aria-label={t('displayLanguage')}>
            {[
              ['ja', t('japanese'), t('languageOptionJapaneseCopy')],
              ['vi', t('vietnamese'), t('languageOptionVietnameseCopy')],
            ].map(([value, label, copy]) => (
              <label className={`language-choice-card ${language === value ? 'active' : ''}`} key={value}>
                <input
                  checked={language === value}
                  name="profile-language"
                  onChange={() => setLanguage(value)}
                  type="radio"
                  value={value}
                />
                <span className="language-choice-mark">{value.toUpperCase()}</span>
                <span>
                  <strong>{label}</strong>
                  <small>{copy}</small>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="panel zip-profile-panel settings-side-panel">
          <span className="settings-panel-icon">✓</span>
          <h2 className="panel-title">{t('currentLanguage')}</h2>
          <strong className="settings-current-value">{language === 'vi' ? t('vietnamese') : t('japanese')}</strong>
          <p className="muted-copy">{t('savedInBrowser')}</p>
        </section>
      </div>
    );
  }

  function renderLogoutPanel() {
    return (
      <section className="panel zip-profile-panel logout-inline-panel">
        <span className="settings-panel-icon danger">🚪</span>
        <h2 className="panel-title">{t('logoutQuestion')}</h2>
        <p className="muted-copy">{t('confirmLogoutCopy')}</p>
        <div className="logout-account-card">
          <span className="logout-avatar">山</span>
          <span>
            <strong>{t('signedInAs')}</strong>
            <small>山田 太郎 · yamada@example.com</small>
          </span>
        </div>
        <div className="logout-confirm-actions">
          <Link className="secondary-button settings-action-link" to="/user-info/profile">{t('noCancel')}</Link>
          <button className="submit-button settings-danger-button" type="button" onClick={confirmLogout}>{t('yesLogout')}</button>
        </div>
      </section>
    );
  }

  function renderProfilePanel() {
    return (
      <div className="profile-reference-grid">
        <div>
          <section className="panel zip-profile-panel">
            <h2 className="panel-title">{t('personalInfo')}</h2>
            <div className="form-grid">
              <label><span>{t('surname')}</span><input defaultValue="山田" /></label>
              <label><span>{t('givenName')}</span><input defaultValue="太郎" /></label>
              <label className="field full"><span>{t('emailAddress')}</span><input defaultValue="yamada@example.com" /></label>
              <label><span>{t('gender')}</span><select defaultValue="male"><option value="male">{t('male')}</option><option value="female">{t('female')}</option></select></label>
              <label><span>{t('phoneNumber')}</span><input defaultValue="+84 123 456 789" /></label>
              <label className="field full"><span>{t('address')}</span><input defaultValue="Ba Dinh, Ha Noi" /></label>
            </div>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">{t('quickAddress')}</h2>
            <div className="saved-address-grid">
              {Object.entries(savedPlaces).map(([key, place]) => {
                const title = t(savedPlaceTitleKeys[key] ?? 'quickFavorite');
                return (
                  <label className="saved-address-row" key={key}>
                    <span className="saved-address-icon">{place.icon}</span>
                    <span>
                      <strong>{title}</strong>
                      <input
                        onChange={(event) => updateSavedPlace(key, event.target.value)}
                        placeholder={`${title}${t('inputAddressFor')}`}
                        value={place.address}
                      />
                    </span>
                  </label>
                );
              })}
            </div>
            <button className="submit-button saved-address-save" type="button" onClick={saveProfile}>{t('saveAddress')}</button>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">{t('notifications')}</h2>
            {renderNotificationSettings()}
          </section>
        </div>

        <div>
          <section className="panel zip-profile-panel">
            <h2 className="panel-title">{t('accountInfo')}</h2>
            <div className="setting-list">
              <button className="account-card" type="button" onClick={() => setModal('account')}><strong>{t('loginAccount')}</strong><span>yamada@example.com</span></button>
              <Link className="account-card" to="/user-info/language"><strong>{t('displayLanguage')}</strong><span>{language === 'vi' ? t('vietnamese') : t('japanese')}</span></Link>
              <Link className="account-card" to="/user-info/payment"><strong>{t('paymentMethod')}</strong><span>カード **** 4821</span></Link>
              <article className="account-card"><strong>{t('registeredDate')}</strong><span>2026年03月10日</span></article>
            </div>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">{t('security')}</h2>
            {renderSecuritySettings(true)}
          </section>
        </div>
      </div>
    );
  }

  function renderContent() {
    if (activeSection === 'security') {
      return (
        <section className="panel zip-profile-panel">
          <h2 className="panel-title">{t('security')}</h2>
          {renderSecuritySettings()}
        </section>
      );
    }

    if (activeSection === 'notifications') {
      return (
        <section className="panel zip-profile-panel">
          <h2 className="panel-title">{t('notifications')}</h2>
          {renderNotificationSettings()}
        </section>
      );
    }

    if (activeSection === 'payment') return renderPaymentPanel();
    if (activeSection === 'language') return renderLanguagePanel();
    if (activeSection === 'logout') return renderLogoutPanel();

    return renderProfilePanel();
  }

  return (
    <PageShell>
      <main className="app-screen zip-profile-screen">
        <div className="profile-window">
          <Topbar actions={<><Link to="/home">{t('navHome')}</Link><Link to="/messages/driver">{t('navMessages')}</Link><img className="topbar-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" /></>} />
          <section className="profile-page-shell zip-profile-shell">
            <aside className="profile-sidebar">
              <section className="profile-card zip-profile-card">
                <div className="profile-avatar">山</div>
                <strong>山田 太郎</strong>
                <span>yamada@example.com</span>
                <em>{t('generalUser')}</em>
              </section>
              <nav className="side-menu" aria-label={t('profileMenu')}>
                {userMenu.map((tab) => (
                  <NavLink className={({ isActive }) => `side-item ${isActive || activeSection === tab.id ? 'active' : ''}`} to={tab.to} key={tab.id}>
                    <span>{tab.icon}</span>
                    <span>{t(tab.labelKey)}</span>
                  </NavLink>
                ))}
              </nav>
            </aside>

            <section className="profile-content">
              <div className="profile-header zip-profile-header">
                <div>
                  <h1>{t('profileSettings')}</h1>
                  <p>{t('profileCopy')}</p>
                </div>
                <button className="submit-button profile-save-button" type="button" onClick={saveProfile}>{t('saveChanges')}</button>
              </div>
              {renderContent()}
            </section>
          </section>
        </div>

        <Modal open={Boolean(modal)} title={modalTitle || t('saved')} onClose={closeModal}>
          {modal === 'account' && (
            <div className="modal-form zip-modal-form">
              <label><span>{t('loginId')}</span><input defaultValue="yamada_taro" /></label>
              <label><span>{t('emailAddress')}</span><input type="email" defaultValue="yamada@example.com" /></label>
              <label><span>{t('phoneNumber')}</span><input defaultValue="+84 123 456 789" /></label>
              <label><span>{t('displayName')}</span><input defaultValue="山田 太郎" /></label>
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal(null)}>{t('saveChanges')}</button>
            </div>
          )}
          {modal === 'password' && (
            <div className="modal-form zip-modal-form">
              <label><span>{t('currentPassword')}</span><input type="password" /></label>
              <label><span>{t('newPassword')}</span><input type="password" /></label>
              <label><span>{t('confirmNewPassword')}</span><input type="password" /></label>
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal(null)}>{t('saveChanges')}</button>
            </div>
          )}
          {modal === 'loginHistory' && <div className="modal-list"><span>2026/05/14 21:30 - Chrome / Windows</span><span>2026/05/12 08:15 - Mobile Safari</span></div>}
          {modal && !['account', 'password', 'loginHistory'].includes(modal) && <p className="modal-copy">{t('saveContentCopy')}</p>}
        </Modal>
      </main>
    </PageShell>
  );
}
