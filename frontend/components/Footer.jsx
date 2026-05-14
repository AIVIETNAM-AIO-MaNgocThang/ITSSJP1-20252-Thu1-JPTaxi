import { NavLink } from 'react-router-dom';
import '../styles/footer.css';

export default function Footer() {
  return (
    <footer className="bottom-nav" aria-label="メインナビゲーション">
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to="/home">
        <span className="bottom-icon" aria-hidden="true">🏠</span>
        <span>ホーム</span>
      </NavLink>
      <div className="divider"></div>
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to="/messages">
        <span className="bottom-icon" aria-hidden="true">💬</span>
        <span>メッセージ</span>
      </NavLink>
      <div className="divider"></div>
      <NavLink className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`} to="/user-info">
        <span className="bottom-icon" aria-hidden="true">👤</span>
        <span>アカウント</span>
      </NavLink>
    </footer>
  );
}
