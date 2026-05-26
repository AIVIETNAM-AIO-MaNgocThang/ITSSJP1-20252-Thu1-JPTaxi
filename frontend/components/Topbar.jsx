import { Link } from 'react-router-dom';

export default function Topbar({ brandTo = '/home' }) {
  return (
    <header className="topbar">
      <Link className="brand" to={brandTo} aria-label="JP TAXI">
        <span className="brand-icon" aria-hidden="true">🚕</span>
        <span>JP TAXI</span>
      </Link>
    </header>
  );
}
