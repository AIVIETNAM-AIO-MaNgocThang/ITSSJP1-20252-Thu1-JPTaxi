import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Footer from '../components/Footer.jsx';
import Modal from '../components/Modal.jsx';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import {
  getDriverProfile,
  resolveAssetUrl,
  updateDriverBankAccount,
  updateDriverProfile,
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

const driverMenu = [
  { id: 'basic', icon: '👤', to: '/driver-info/basic' },
  { id: 'vehicle', icon: '🚗', to: '/driver-info/vehicle' },
  { id: 'history', icon: '📈', to: '/driver-info/history' },
  { id: 'payout', icon: '💰', to: '/driver-info/payout' },
  { id: 'language', icon: '🌐', to: '/driver-info/language' },
  { id: 'logout', icon: '🚪', to: '/driver-info/logout' },
];

const fallbackDriver = {
  lastName: '山田',
  firstName: '太郎',
  nationality: 'Japan',
  phone: '+84123456789',
  email: localStorage.getItem('jpTaxiUserEmail') || 'driver1@example.com',
  japaneseLevel: 'N2',
  birthDate: '1990-01-01',
  gender: 'Male',
  idNumber: '',
  avatarUrl: '',
  vehicle: {
    brand: 'Toyota',
    color: 'White',
    licensePlate: '30A-123.45',
    vehicleType: '4',
  },
  licenses: [],
  bankAccount: {
    bankName: 'Vietcombank',
    accountNumber: '00000291',
    accountHolder: 'TARO YAMADA',
  },
  trips: [],
};

function normalizeProfile(profile = fallbackDriver) {
  return {
    ...fallbackDriver,
    ...profile,
    birthDate: profile.birthDate ? String(profile.birthDate).slice(0, 10) : fallbackDriver.birthDate,
    avatarUrl: resolveAssetUrl(profile.avatarUrl),
    vehicle: profile.vehicle || fallbackDriver.vehicle,
    bankAccount: profile.bankAccount || fallbackDriver.bankAccount,
    licenses: Array.isArray(profile.licenses) ? profile.licenses : [],
    trips: Array.isArray(profile.trips) ? profile.trips : [],
  };
}

function formatCurrency(value) {
  if (!value) return '¥0';
  return `¥${Number(value).toLocaleString('ja-JP')}`;
}

function formatDate(value, locale = 'ja-JP') {
  if (!value) return '';
  return new Date(value).toLocaleDateString(locale);
}

export default function DriverInfoPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const activeSection = driverMenu.some((item) => item.id === section) ? section : 'basic';
  const [online, setOnline] = useState(true);
  const [modal, setModal] = useState(null);
  const [profile, setProfile] = useState(fallbackDriver);
  const [bankAccount, setBankAccount] = useState(fallbackDriver.bankAccount);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(getStoredProfileLanguage);
  const text = profileText[language] || profileText.ja;
  const common = text.common;
  const driverText = text.driver;

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      setLoading(true);
      try {
        const data = normalizeProfile(await getDriverProfile());
        if (!ignore) {
          setProfile(data);
          setBankAccount(data.bankAccount);
        }
      } catch (error) {
        if (!ignore) setStatus(error.message || text.status.driverDemo);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      ignore = true;
    };
  }, [text.status.driverDemo]);

  useEffect(() => {
    function syncLanguage(event) {
      setLanguage(event.detail?.language || getStoredProfileLanguage());
    }

    window.addEventListener(LANGUAGE_EVENT, syncLanguage);
    return () => window.removeEventListener(LANGUAGE_EVENT, syncLanguage);
  }, []);

  const fullName = `${profile.lastName} ${profile.firstName}`.trim();
  const avatar = profile.avatarUrl;
  const vehicle = profile.vehicle || fallbackDriver.vehicle;
  const totalSales = profile.trips.reduce((sum, trip) => sum + Number(trip.finalFareJpy || 0), 0);
  const completedTrips = profile.trips.filter((trip) => trip.status === 'completed').length;

  const modalTitle = {
    account: driverText.modal.account,
    vehicle: driverText.modal.vehicle,
    password: driverText.modal.password,
    bank: driverText.modal.bank,
    saved: driverText.modal.saved,
    error: driverText.modal.error,
  }[modal] || driverText.modal.detail;

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateBankField(field, value) {
    setBankAccount((current) => ({ ...current, [field]: value }));
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
    try {
      const updated = await updateDriverProfile({
        lastName: profile.lastName,
        firstName: profile.firstName,
        gender: profile.gender,
        birthDate: profile.birthDate,
        phone: profile.phone,
        email: profile.email,
        nationality: profile.nationality,
        idNumber: profile.idNumber || null,
        japaneseLevel: profile.japaneseLevel,
        avatarUrl: profile.avatarUrl || null,
      });
      const normalized = normalizeProfile(updated);
      setProfile(normalized);
      setBankAccount(normalized.bankAccount);
      setModal('saved');
      setStatus(text.status.dbSaved);
    } catch (error) {
      setModal('error');
      setStatus(error.message || text.status.driverSaveFailed);
    }
  }

  async function saveBankAccount() {
    try {
      const updated = await updateDriverBankAccount(bankAccount);
      const normalized = normalizeProfile(updated);
      setProfile(normalized);
      setBankAccount(normalized.bankAccount);
      setModal('saved');
      setStatus(text.status.driverBankSaved);
    } catch (error) {
      setModal('error');
      setStatus(error.message || text.status.driverBankFailed);
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

  function renderTab() {
    if (activeSection === 'vehicle') {
      return (
        <div className="profile-grid">
          <section className="panel zip-profile-panel">
            <h2 className="panel-title">{driverText.vehicleInfo}</h2>
            <div className="driver-info-card">
              <span>🚗</span>
              <div>
                <strong>{vehicle.brand || common.unregistered} <small>({vehicle.color || '-'})</small></strong>
                <p>{driverText.plate}: {vehicle.licensePlate || '-'} / {driverText.seats}: {vehicle.vehicleType || '-'}</p>
              </div>
              <em>{driverText.verified}</em>
            </div>
            <div className="vehicle-actions">
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal('vehicle')}>{common.details}</button>
            </div>
          </section>

          <aside className="panel zip-profile-panel">
            <h2 className="panel-title">{driverText.docs}</h2>
            <div className="license-preview-card">
              <span className="license-preview-title">{driverText.license}</span>
              <div className="license-preview-frame">
                <span>LICENSE IMAGE</span>
              </div>
            </div>
            <div className="doc-list">
              {profile.licenses.length ? profile.licenses.map((license) => (
                <button type="button" key={`${license.licenseType}-${license.expiryDate}`} onClick={() => setModal('license')}>
                  {license.licenseType} <strong>{formatDate(license.expiryDate, text.locale)}</strong>
                </button>
              )) : <button type="button" onClick={() => setModal('license')}>{driverText.license} <strong>{common.unregistered}</strong></button>}
            </div>
          </aside>
        </div>
      );
    }

    if (activeSection === 'history') {
      return (
        <section className="panel zip-profile-panel">
          <h2 className="panel-title">{driverText.historyTitle}</h2>
          <div className="trip-summary">
            <article><span>{driverText.completedTrips}</span><strong>{completedTrips}</strong></article>
            <article><span>{driverText.ratingLabel}</span><strong>4.9</strong></article>
            <article><span>{driverText.sales}</span><strong>{formatCurrency(totalSales)}</strong></article>
          </div>
          <div className="modal-list history-list">
            {profile.trips.length ? profile.trips.map((trip) => (
              <span key={`${trip.startTime}-${trip.pickupAddress}`}>{formatDate(trip.startTime, text.locale)} {trip.pickupAddress} → {trip.dropoffAddress} / {formatCurrency(trip.finalFareJpy)}</span>
            )) : <span>{driverText.noHistory}</span>}
          </div>
        </section>
      );
    }

    if (activeSection === 'payout') {
      return (
        <section className="panel zip-profile-panel narrow-panel">
          <h2 className="panel-title">{driverText.payoutTitle}</h2>
          <div className="setting-list">
            <article className="account-card"><strong>{driverText.weeklyPayout}</strong><span>{formatCurrency(totalSales)}</span></article>
            <button className="account-card" type="button" onClick={() => setModal('bank')}><strong>{driverText.bank}</strong><span>{bankAccount.bankName} **** {bankAccount.accountNumber.slice(-4)}</span></button>
            <button className="submit-button profile-save-button" type="button" onClick={() => setModal('bank')}>{common.edit}</button>
          </div>
        </section>
      );
    }

    if (activeSection === 'language') {
      return (
        <section className="panel zip-profile-panel narrow-panel">
          <h2 className="panel-title">{driverText.menu.language}</h2>
          <label>
            <span>{text.user.displayLanguage}</span>
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
          <p className="muted-copy">{driverText.logoutCopy}</p>
          <button className="submit-button profile-save-button" type="button" onClick={handleLogout}>{common.logout}</button>
        </section>
      );
    }

    return (
      <div className="driver-reference-grid">
        <div>
          <label className="status-toggle">
            <span>
              <strong>{online ? driverText.online : driverText.offline}</strong>
              <small>{online ? driverText.onlineCopy : driverText.offlineCopy}</small>
            </span>
            <span className="switch"><input type="checkbox" checked={online} onChange={(event) => setOnline(event.target.checked)} /><span></span></span>
          </label>

          <section className="panel zip-profile-panel driver-basic-card">
            <h2 className="panel-title">{driverText.basicInfo}</h2>
            <div className="form-grid driver-edit-grid">
              <label><span>{common.lastName}</span><input value={profile.lastName} onChange={(event) => updateField('lastName', event.target.value)} /></label>
              <label><span>{common.firstName}</span><input value={profile.firstName} onChange={(event) => updateField('firstName', event.target.value)} /></label>
              <label><span>{common.phone}</span><input value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
              <label><span>{common.email}</span><input type="email" value={profile.email} onChange={(event) => updateField('email', event.target.value)} /></label>
              <label><span>{driverText.nationality}</span><input value={profile.nationality} onChange={(event) => updateField('nationality', event.target.value)} /></label>
              <label>
                <span>{driverText.japaneseLevel}</span>
                <select value={profile.japaneseLevel} onChange={(event) => updateField('japaneseLevel', event.target.value)}>
                  {['N5', 'N4', 'N3', 'N2', 'N1', 'Native'].map((level) => <option value={level} key={level}>{level}</option>)}
                </select>
              </label>
              <label>
                <span>{common.gender}</span>
                <select value={profile.gender} onChange={(event) => updateField('gender', event.target.value)}>
                  <option value="Male">{common.male}</option>
                  <option value="Female">{common.female}</option>
                  <option value="Other">{common.other}</option>
                </select>
              </label>
              <label><span>{common.birthDate}</span><input type="date" value={profile.birthDate} onChange={(event) => updateField('birthDate', event.target.value)} /></label>
              <label className="field full"><span>{driverText.identityNumber}</span><input value={profile.idNumber || ''} onChange={(event) => updateField('idNumber', event.target.value)} /></label>
            </div>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">{driverText.vehicleInfo}</h2>
            <div className="driver-info-card">
              <span>🚗</span>
              <div>
                <strong>{vehicle.brand} <small>({vehicle.color})</small></strong>
                <p>{driverText.plate}: {vehicle.licensePlate} • {driverText.seats}: {vehicle.vehicleType}</p>
              </div>
              <em>✓ {driverText.verified}</em>
            </div>
          </section>
        </div>

        <div>
          <section className="panel zip-profile-panel">
            <h2 className="panel-title">{driverText.docs}</h2>
            <div className="doc-list">
              <button type="button" onClick={() => setModal('license')}>🪪 {driverText.license} <strong>{profile.licenses.length ? common.approved : common.unregistered}</strong></button>
              <button type="button" onClick={() => setModal('vehicle')}>📘 {driverText.inspection} <strong>{common.approved}</strong></button>
              <button className="warning" type="button" onClick={() => setModal('insurance')}>📋 {driverText.insurance} <strong>{driverText.updateRequired}</strong></button>
            </div>
          </section>

          <section className="panel zip-profile-panel stack">
            <h2 className="panel-title">{driverText.accountSafety}</h2>
            <div className="security-list">
              <article className="security-item">
                <strong>{common.password}</strong>
                <button className="link-btn" type="button" onClick={() => setModal('password')}>{common.edit}</button>
              </article>
              <article className="security-item">
                <strong>{common.bankAccount}</strong>
                <span>{bankAccount.bankName} / {bankAccount.accountHolder}</span>
                <button className="link-btn" type="button" onClick={() => setModal('bank')}>{common.edit}</button>
              </article>
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
          <Topbar brandTo="/driver-home" brandExtra="for Driver" actions={<><Link to="/driver-home">{common.home}</Link><Link to="/messages/customer">{common.messages}</Link>{avatar ? <img className="topbar-avatar driver-avatar-top" src={avatar} alt="" /> : <span className="topbar-avatar driver-avatar-top" />}</>} />
          <section className="profile-page-shell zip-profile-shell">
            <aside className="profile-sidebar">
              <section className="profile-card zip-profile-card driver-profile-card">
                <div className="profile-avatar">
                  {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : profile.lastName}
                </div>
                <strong>{fullName}</strong>
                <span>⭐ 4.9 ({completedTrips || 0} {driverText.rating})</span>
                <em>{loading ? common.loading : driverText.role}</em>
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </section>
              <nav className="side-menu" aria-label={driverText.pageTitle}>
                {driverMenu.map((tab) => (
                  <NavLink className={({ isActive }) => `side-item ${isActive || activeSection === tab.id ? 'active' : ''}`} to={tab.to} key={tab.id}>
                    <span>{tab.icon}</span>
                    <span>{driverText.menu[tab.id]}</span>
                  </NavLink>
                ))}
              </nav>
            </aside>

            <section className="profile-content">
              <div className="profile-header zip-profile-header">
                <div>
                  <h1>{driverText.pageTitle}</h1>
                  <p>{driverText.pageSubtitle}</p>
                  {status && <p className="muted-copy">{status}</p>}
                </div>
                <button className="submit-button profile-save-button" type="button" onClick={saveProfile}>{driverText.saveInfo}</button>
              </div>
              {renderTab()}
            </section>
          </section>
          <Footer />
        </div>

        <Modal open={Boolean(modal)} title={modalTitle} onClose={() => setModal(null)}>
          {modal === 'account' && (
            <div className="modal-form zip-modal-form">
              <label><span>{common.email}</span><input type="email" value={profile.email} onChange={(event) => updateField('email', event.target.value)} /></label>
              <label><span>{common.phone}</span><input value={profile.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
              <label><span>{driverText.modal.displayName}</span><input value={fullName} readOnly /></label>
              <button className="submit-button profile-save-button" type="button" onClick={saveProfile}>{common.save}</button>
            </div>
          )}
          {modal === 'vehicle' && (
            <div className="modal-form zip-modal-form">
              <div className="form-grid">
                <label><span>{driverText.modal.manufacturer}</span><input value={vehicle.brand || ''} readOnly /></label>
                <label><span>{common.color}</span><input value={vehicle.color || ''} readOnly /></label>
                <label><span>{driverText.seats}</span><input value={vehicle.vehicleType || ''} readOnly /></label>
                <label><span>{driverText.plate}</span><input value={vehicle.licensePlate || ''} readOnly /></label>
              </div>
              <p className="modal-copy">{driverText.modal.vehicleDbCopy}</p>
            </div>
          )}
          {modal === 'bank' && (
            <div className="modal-form zip-modal-form">
              <label><span>{driverText.bankName}</span><input value={bankAccount.bankName} onChange={(event) => updateBankField('bankName', event.target.value)} /></label>
              <label><span>{driverText.accountNumber}</span><input value={bankAccount.accountNumber} onChange={(event) => updateBankField('accountNumber', event.target.value)} /></label>
              <label><span>{driverText.accountHolder}</span><input value={bankAccount.accountHolder} onChange={(event) => updateBankField('accountHolder', event.target.value)} /></label>
              <button className="submit-button profile-save-button" type="button" onClick={saveBankAccount}>{common.save}</button>
            </div>
          )}
          {modal === 'password' && (
            <div className="modal-form zip-modal-form">
              <label><span>{driverText.modal.currentPassword}</span><input type="password" /></label>
              <label><span>{driverText.modal.newPassword}</span><input type="password" /></label>
              <button className="submit-button profile-save-button" type="button" onClick={() => setModal(null)}>{common.save}</button>
            </div>
          )}
          {modal && !['account', 'vehicle', 'bank', 'password'].includes(modal) && <p className="modal-copy">{status || driverText.modal.defaultCopy}</p>}
        </Modal>
      </main>
    </PageShell>
  );
}
