import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Footer from '../components/Footer.jsx';
import Modal from '../components/Modal.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  getCustomerProfile,
  resolveAssetUrl,
  updateCustomerProfile,
  uploadAvatar,
} from '../api/accounts.js';
import {
  getStoredProfileLanguage,
  languageOptions,
  LANGUAGE_EVENT,
  profileText,
  setStoredProfileLanguage,
} from '../i18n/profileLanguage.js';
import '../styles/app-pages.css';
import { readSavedPlaces, writeSavedPlaces } from '../utils/savedPlaces.js';

const userMenu = [
  { id: 'profile', icon: '👤', to: '/user-info/profile' },
  { id: 'security', icon: '🔒', to: '/user-info/security' },
  { id: 'notifications', icon: '🔔', to: '/user-info/notifications' },
  { id: 'payment', icon: '💳', to: '/user-info/payment' },
  { id: 'language', icon: '🌐', to: '/user-info/language' },
  { id: 'logout', icon: '🚪', to: '/user-info/logout' },
];

const fallbackProfile = {
  lastName: '山田',
  firstName: '太郎',
  email: localStorage.getItem('jpTaxiUserEmail') || 'yamada@example.com',
  gender: 'Male',
  phone: '+84123456789',
  birthDate: '1990-01-01',
  avatarUrl: '',
  createdAt: '2026-03-10',
  loginHistory: [],
};

function normalizeProfile(profile = fallbackProfile) {
  return {
    ...fallbackProfile,
    ...profile,
    birthDate: profile.birthDate ? String(profile.birthDate).slice(0, 10) : fallbackProfile.birthDate,
    avatarUrl: resolveAssetUrl(profile.avatarUrl),
    loginHistory: Array.isArray(profile.loginHistory) ? profile.loginHistory : [],
  };
}

function formatDate(value, locale = 'ja-JP') {
  if (!value) return '';
  return new Date(value).toLocaleDateString(locale);
}

export default function UserInfoPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = userMenu.some((item) => item.id === section) ? section : 'profile';
  const [modal, setModal] = useState(null);
  const [profile, setProfile] = useState(fallbackProfile);
  const [savedPlaces, setSavedPlaces] = useState(readSavedPlaces);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(getStoredProfileLanguage);
  const text = profileText[language] || profileText.ja;
  const common = text.common;
  const userText = text.user;

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      setLoading(true);
      try {
        const data = await getCustomerProfile();
        if (!ignore) setProfile(normalizeProfile(data));
      } catch (error) {
        if (!ignore) setStatus(error.message || text.status.userDemo);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      ignore = true;
    };
  }, [text.status.userDemo]);

  useEffect(() => {
    function syncLanguage(event) {
      setLanguage(event.detail?.language || getStoredProfileLanguage());
    }

    window.addEventListener(LANGUAGE_EVENT, syncLanguage);
    return () => window.removeEventListener(LANGUAGE_EVENT, syncLanguage);
  }, []);

  const fullName = `${profile.lastName} ${profile.firstName}`.trim();
  const avatar = profile.avatarUrl;

  const modalTitle = {
    account: userText.modal.account,
    avatar: userText.modal.avatar,
    password: userText.modal.password,
    loginHistory: userText.modal.loginHistory,
    card: userText.modal.card,
    addCard: userText.modal.addCard,
    logout: userText.modal.logout,
    saved: userText.modal.saved,
    error: userText.modal.error,
  }[modal];

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
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

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAvatar(file);
      if (url) {
        setProfile((current) => ({ ...current, avatarUrl: url }));
        setStatus(text.status.avatarUploaded);
      }
    } catch (error) {
      setStatus(error.message || text.status.avatarFailed);
    }
  }

  async function saveProfile() {
    writeSavedPlaces(savedPlaces);
    try {
      const updated = await updateCustomerProfile({
        lastName: profile.lastName,
        firstName: profile.firstName,
        gender: profile.gender,
        birthDate: profile.birthDate,
        phone: profile.phone,
        email: profile.email,
        avatarUrl: profile.avatarUrl || null,
      });
      setProfile(normalizeProfile(updated));
      setModal('saved');
      setStatus(text.status.dbSaved);
    } catch (error) {
      setModal('error');
      setStatus(error.message || text.status.userSaveFailed);
    }
  }

  function changeLanguage(nextLanguage) {
    setLanguage(setStoredProfileLanguage(nextLanguage));
  }

  function handleLogout() {
    localStorage.removeItem('jpTaxiToken');
    localStorage.removeItem('jpTaxiRole');
    localStorage.removeItem('jpTaxiUserEmail');
    localStorage.removeItem('jpTaxiCustomerId');
    localStorage.removeItem('jpTaxiDriverId');
    localStorage.removeItem('jpTaxiFallbackRide');
    localStorage.removeItem('jpTaxiPaymentRequested');
    sessionStorage.removeItem('jpTaxiRideRequestId');
    sessionStorage.removeItem('jpTaxiTripId');
    sessionStorage.removeItem('jpTaxiSelectedRoute');
    navigate('/login', { replace: true });
  }

  function renderContent() {
    if (activeSection === 'security') {
      return (
        <section className="panel zip-profile-panel">
          <h2 className="panel-title">{common.security}</h2>
          <div className="security-list">
            {userText.security.map(([title, copy, action], index) => (
              <article className="security-item" key={title}>
                <strong>{title}</strong>
                <span>{copy}</span>
                {index === 1 ? (
                  <NavLink className="link-btn" to="/user-info/profile">{action}</NavLink>
                ) : (
                  <button className="link-btn" type="button" onClick={() => setModal(index === 0 ? 'password' : 'loginHistory')}>{action}</button>
                )}
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeSection === 'notifications') {
      return (
        <section className="panel zip-profile-panel">
          <h2 className="panel-title">{userText.menu.notifications}</h2>
          <div className="setting-list">
            {userText.notifications.map(([icon, title, sub]) => (
              <label className="setting-row" key={title}>
                <span className="icon-box">{icon}</span>
                <span><strong>{title}</strong><small>{sub}</small></span>
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
          <h2 className="panel-title">{userText.paymentTitle}</h2>
          <div className="setting-list">
            <button className="account-card" type="button" onClick={() => setModal('card')}>
              <strong>{userText.defaultPayment}</strong>
              <span>{common.card}</span>
            </button>
            <button className="submit-button profile-save-button" type="button" onClick={() => setModal('addCard')}>{common.addCard}</button>
          </div>
        </section>
      );
    }

    if (activeSection === 'language') {
      return (
        <section className="panel zip-profile-panel narrow-panel">
          <h2 className="panel-title">{userText.languageTitle}</h2>
          <label>
            <span>{userText.displayLanguage}</span>
            <select value={language} onChange={(event) => changeLanguage(event.target.value)}>
              {languageOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </section>
      );
    }

    if (activeSection === 'logout') {
      return (
        <section className="panel zip-profile-panel narrow-panel">
          <h2 className="panel-title">{common.logout}</h2>
          <p className="muted-copy">{userText.logoutCopy}</p>
          <button className="submit-button profile-save-button" type="button" onClick={handleLogout}>{common.logout}</button>
        </section>
      );
    }

    return (
      <div className="profile-reference-grid">
        <div>
          <section className="panel zip-profile-panel">
            <h2 className="panel-title">{userText.personalInfo}</h2>
            <div className="form-grid">
              <label><span>{common.lastName}</span><input value={profile.lastName} onChange={(event) => updateField('lastName', event.target.value)} /></label>
              <label><span>{common.firstName}</span><input value={profile.firstName} onChange={(event) => updateField('firstName', event.target.value)} /></label>
              <label className="field full"><span>{common.email}</span><input type="email" value={profile.email} onChange={(event) => updateField('email', event.target.value)} /></label>
              <label>
                <span>{common.gender}</span>
                <select value={profile.gender} onChange={(event) => updateField('gender', event.target.value)}>
                  <option value="Male">{common.male}</option>
                  <option value="Female">{common.female}</option>
                  <option value="Other">{common.other}</option>
                </select>
              </label>
              <label><span>{common.phone}</span><input value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
              <label className="field full"><span>{userText.address}</span><input defaultValue="Ba Dinh, Ha Noi" /></label>
            </div>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">{userText.menu.notifications}</h2>
            <div className="setting-list">
              {userText.notifications.map(([icon, title, sub]) => (
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
            <h2 className="panel-title">{userText.accountInfo}</h2>
            <div className="setting-list">
              <Link className="account-card profile-info-card" to="/user-info/language">
                <span className="account-icon">🌐</span>
                <span><strong>{userText.displayLanguage}</strong><small>{languageOptions.find((item) => item.value === language)?.label || '日本語'}</small></span>
              </Link>
              <Link className="account-card profile-info-card" to="/user-info/payment">
                <span className="account-icon">💳</span>
                <span><strong>{userText.defaultPayment}</strong><small>{common.card}</small></span>
              </Link>
              <article className="account-card profile-info-card">
                <span className="account-icon">🕘</span>
                <span><strong>{userText.registeredDate}</strong><small>{formatDate(profile.createdAt, text.locale) || '2026/03/10'}</small></span>
              </article>
            </div>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">{common.security}</h2>
            <div className="security-list">
              {userText.securityHome.map(([title, copy, action], index) => (
                <article className="security-item" key={title}>
                  <strong>{title}</strong>
                  <span>{copy}</span>
                  <button className="link-btn" type="button" onClick={() => setModal(index === 0 ? 'password' : 'loginHistory')}>{action}</button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <PageShell withFooter={false}>
      <main className="app-screen zip-profile-screen">
        <div className="profile-window">
          <Topbar actions={<><Link to="/home">{common.home}</Link><Link to="/messages/driver">{common.messages}</Link>{avatar ? <img className="topbar-avatar" src={avatar} alt="" /> : <span className="topbar-avatar" />}</>} />
          <section className="profile-page-shell zip-profile-shell">
            <aside className="profile-sidebar">
              <section className="profile-card zip-profile-card">
                <div className="profile-avatar">
                  {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : profile.lastName.slice(0, 1)}
                </div>
                <strong>{fullName}</strong>
                <span>{profile.email}</span>
                <em>{loading ? common.loading : userText.role}</em>
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </section>
              <nav className="side-menu" aria-label={userText.pageTitle}>
                {userMenu.map((tab) => (
                  <NavLink className={({ isActive }) => `side-item ${isActive || activeSection === tab.id ? 'active' : ''}`} to={tab.to} key={tab.id}>
                    <span>{tab.icon}</span>
                    <span>{userText.menu[tab.id]}</span>
                  </NavLink>
                ))}
              </nav>
            </aside>

            <section className="profile-content">
              <div className="profile-header zip-profile-header">
                <div>
                  <h1>{userText.pageTitle}</h1>
                  <p>{userText.pageSubtitle}</p>
                  {status && <p className="muted-copy">{status}</p>}
                </div>
                <button className="submit-button profile-save-button" type="button" onClick={saveProfile}>{common.saveChanges}</button>
              </div>
              {renderContent()}
            </section>
          </section>
          <Footer />
        </div>

        <Modal open={Boolean(modal)} title={modalTitle || userText.modal.saved} onClose={() => setModal(null)}>
          {modal === 'account' && (
            <div className="modal-form zip-modal-form">
              <label><span>{common.email}</span><input type="email" value={profile.email} onChange={(event) => updateField('email', event.target.value)} /></label>
              <label><span>{common.phone}</span><input value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
              <label><span>{userText.modal.displayName}</span><input value={fullName} readOnly /></label>
              <button className="submit-button profile-save-button" type="button" onClick={saveProfile}>{common.save}</button>
            </div>
          )}
          {modal === 'password' && (
            <div className="modal-form zip-modal-form">
              <label><span>{userText.modal.currentPassword}</span><input type="password" /></label>
              <label><span>{userText.modal.newPassword}</span><input type="password" /></label>
              <label><span>{userText.modal.confirmPassword}</span><input type="password" /></label>
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal(null)}>{common.save}</button>
            </div>
          )}
          {modal === 'loginHistory' && (
            <div className="modal-list">
              {profile.loginHistory.length ? profile.loginHistory.map((item) => (
                <span key={`${item.loginTime}-${item.ipAddress}`}>{formatDate(item.loginTime, text.locale)} - {item.ipAddress || 'unknown'}</span>
              )) : <span>{userText.modal.emptyLoginHistory}</span>}
            </div>
          )}
          {modal && !['account', 'password', 'loginHistory'].includes(modal) && <p className="modal-copy">{status || userText.modal.defaultCopy}</p>}
        </Modal>
      </main>
    </PageShell>
  );
}
