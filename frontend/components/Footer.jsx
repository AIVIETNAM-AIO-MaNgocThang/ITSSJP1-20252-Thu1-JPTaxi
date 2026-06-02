import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageProvider.jsx';
import '../styles/footer.css';

export default function Footer() {
  const location = useLocation();
  const { common } = useLanguage();
  const activeRole = sessionStorage.getItem('jpTaxiActiveRole') || localStorage.getItem('jpTaxiRole');
  const isDriver =
    location.pathname.startsWith('/driver') ||
    location.pathname === '/messages/customer' ||
    location.pathname === '/xacnhancuocxe' ||
    (!location.pathname.startsWith('/user-info') && activeRole === 'driver');
  const homePath = isDriver ? '/driver-home' : '/home';
  const accountPath = isDriver ? '/driver-info/basic' : '/user-info/profile';
  const messagePath = isDriver ? '/messages/customer' : '/messages/driver';
  const isAccountActive = location.pathname.startsWith('/driver-info') || location.pathname.startsWith('/user-info');

  return (
    <footer className="bottom-nav" aria-label="Main navigation">
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to={homePath}>
        <span className="bottom-icon" aria-hidden="true">🏠</span>
        <span>{common.home}</span>
      </NavLink>
      <div className="divider"></div>
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to={messagePath}>
        <span className="bottom-icon" aria-hidden="true">💬</span>
        <span>{common.messages}</span>
      </NavLink>
      <div className="divider"></div>
      <NavLink className={({ isActive }) => `bottom-item ${isActive || isAccountActive ? 'active' : ''}`} to={accountPath}>
        <span className="bottom-icon" aria-hidden="true">👤</span>
        <span>{common.account}</span>
      </NavLink>
    </footer>
  );
}
