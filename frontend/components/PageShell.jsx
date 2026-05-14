import Footer from './Footer.jsx';

export default function PageShell({ children, withFooter = true }) {
  return (
    <div className={`page-shell ${withFooter ? 'has-footer' : ''}`}>
      {children}
      {withFooter && <Footer />}
    </div>
  );
}
