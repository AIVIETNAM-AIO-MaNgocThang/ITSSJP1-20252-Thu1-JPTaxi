import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getChatPath } from '../utils/chatSession.js';
import '../styles/footer.css';

export default function Footer() {
  const { t } = useLanguage();
  const location = useLocation();
  const isDriver =
    localStorage.getItem('jpTaxiRole') === 'driver' ||
    location.pathname.startsWith('/driver') ||
    location.pathname === '/messages/customer' ||
    location.pathname === '/xacnhancuocxe';
  const homePath = isDriver ? '/driver-home' : '/home';
  const accountPath = isDriver ? '/driver-info/basic' : '/user-info';
  const messagePath = getChatPath(isDriver ? 'customer' : 'driver');

  return (
    <footer className="bottom-nav" aria-label="Main navigation">
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to={homePath}>
        <span className="bottom-icon" aria-hidden="true">🏠</span>
        <span>{t('navHome')}</span>
      </NavLink>
      <div className="divider"></div>
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to={messagePath}>
        <span className="bottom-icon" aria-hidden="true">💬</span>
        <span>{t('navMessages')}</span>
      </NavLink>
      <div className="divider"></div>
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to={accountPath}>
        <span className="bottom-icon" aria-hidden="true">👤</span>
        <span>{t('navAccount')}</span>
      </NavLink>
    </footer>
  );
}
