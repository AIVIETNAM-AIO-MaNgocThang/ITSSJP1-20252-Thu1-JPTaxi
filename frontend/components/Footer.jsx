import { NavLink, useLocation } from 'react-router-dom';
import '../styles/footer.css';

export default function Footer() {
  const location = useLocation();
  const isDriver =
    localStorage.getItem('jpTaxiRole') === 'driver' ||
    location.pathname.startsWith('/driver') ||
    location.pathname === '/xacnhancuocxe';
  const homePath = isDriver ? '/driver-home' : '/home';
  const accountPath = isDriver ? '/driver-info/basic' : '/user-info';
  const messagePath = isDriver ? '/messages/customer' : '/messages/driver';

  return (
    <footer className="bottom-nav" aria-label="メインナビゲーション">
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to={homePath}>
        <span className="bottom-icon" aria-hidden="true">🏠</span>
        <span>ホーム</span>
      </NavLink>
      <div className="divider"></div>
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to={messagePath}>
        <span className="bottom-icon" aria-hidden="true">💬</span>
        <span>メッセージ</span>
      </NavLink>
      <div className="divider"></div>
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to={accountPath}>
        <span className="bottom-icon" aria-hidden="true">👤</span>
        <span>アカウント</span>
      </NavLink>
    </footer>
  );
}
