import { Link } from 'react-router-dom';

export default function Topbar({ actions = null, brandExtra = '', brandTo = '/home' }) {
  return (
    <header className="topbar">
      <Link className="brand" to={brandTo} aria-label="JP TAXI">
        <span className="brand-icon" aria-hidden="true">🚕</span>
        <span>JP TAXI</span>
        {brandExtra ? <small>{brandExtra}</small> : null}
      </Link>
      {actions ? <nav className="topbar-actions" aria-label="Header navigation">{actions}</nav> : null}
    </header>
  );
}
