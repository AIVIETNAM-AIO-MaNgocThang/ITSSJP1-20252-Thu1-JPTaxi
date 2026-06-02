import { Link } from 'react-router-dom';

export default function Topbar({ actions = null, brandExtra = '', brandTo = '/home', children = null }) {
  const activeRole = sessionStorage.getItem('jpTaxiActiveRole') || localStorage.getItem('jpTaxiRole');
  const isDriver = activeRole === 'driver' || brandTo.startsWith('/driver');
  const defaultActions = children && !actions ? (
    <>
      <Link to={isDriver ? '/driver-home' : '/home'}>ホーム</Link>
      <Link to={isDriver ? '/messages/customer' : '/messages/driver'}>メッセージ</Link>
      <Link to={isDriver ? '/driver-info/basic' : '/user-info/profile'}>アカウント</Link>
      {children}
    </>
  ) : null;

  return (
    <header className="topbar">
      <Link className="brand" to={brandTo} aria-label="JP TAXI">
        <span className="brand-icon" aria-hidden="true">🚕</span>
        <span>JP TAXI</span>
        {brandExtra ? <small>{brandExtra}</small> : null}
      </Link>
      {actions || defaultActions || children ? (
        <nav className="topbar-actions" aria-label="Header navigation">
          {actions || defaultActions || children}
        </nav>
      ) : null}
    </header>
  );
}
