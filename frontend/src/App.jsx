import { useState, useEffect } from 'react';
import brand from './brand';
import { isLoggedIn, clearToken, verifyToken } from './utils/api';
import { updatePageSEO } from './utils/seo';
import './App.css';

import Login         from './components/Login';
import Sidebar       from './components/Sidebar';
import MobileNav     from './components/MobileNav';
import Dashboard     from './components/Dashboard';
import Invoices      from './components/Invoices';
import Clients       from './components/Clients';
import Payments      from './components/Payments';
import Subscriptions from './components/Subscriptions';
import Settings      from './components/Settings';

const VIEWS = {
  dashboard:     Dashboard,
  invoices:      Invoices,
  clients:       Clients,
  payments:      Payments,
  subscriptions: Subscriptions,
  settings:      Settings,
};

export default function App() {
  // Read initial view from URL search param if present
  const getInitialView = () => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    return VIEWS[viewParam] ? viewParam : 'dashboard';
  };

  const [view, setView]                 = useState(getInitialView);
  const [overdueCount, setOverdueCount] = useState(0);
  const [authed, setAuthed]             = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [username, setUsername]         = useState('');
  const [isMobile, setIsMobile]         = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  // Synchronize window width & URL query parameter for viewport (< 1024px mobile mode)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      // Update URL query parameters dynamically without full page reload
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      if (mobile) {
        url.searchParams.set('mode', 'mobile');
      } else {
        url.searchParams.delete('mode');
      }
      window.history.replaceState({}, '', url.toString());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  // Synchronous non-blocking SEO title and meta description updates
  useEffect(() => {
    if (!authed) {
      updatePageSEO('login');
    } else {
      updatePageSEO(view);
    }
  }, [view, authed]);

  // Single streamlined authentication verification on page load
  useEffect(() => {
    if (!isLoggedIn()) { setAuthChecking(false); return; }
    verifyToken()
      .then(data => { setAuthed(true); setUsername(data.username || 'admin'); })
      .catch(() => { clearToken(); })
      .finally(() => setAuthChecking(false));
  }, []);

  // Auto-logout when API returns 401
  useEffect(() => {
    const handler = () => { setAuthed(false); setUsername(''); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const handleLogin = (uname) => {
    setAuthed(true);
    setUsername(uname || 'admin');
  };

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    setUsername('');
    setView('dashboard');
  };

  // Show spinner while checking token on first load
  if (authChecking) {
    return (
      <div className="app-auth-checking-container">
        <div className="spinner app-auth-spinner" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!authed) return <Login onLogin={handleLogin} />;

  // Main application view
  const ActiveView = VIEWS[view] || Dashboard;

  return (
    <div className={`app-shell ${isMobile ? 'mode-mobile' : 'mode-desktop'}`}>
      {/* Desktop Sidebar (>= 1024px) */}
      {!isMobile && (
        <Sidebar
          active={view}
          onNavigate={setView}
          overdueCount={overdueCount}
          username={username}
          onLogout={handleLogout}
        />
      )}

      {/* Dedicated Mobile Navigation (< 1024px) */}
      {isMobile && (
        <MobileNav
          active={view}
          onNavigate={setView}
          overdueCount={overdueCount}
          username={username}
          onLogout={handleLogout}
        />
      )}

      <main className="main-content" tabIndex="-1">
        {view === 'invoices'
          ? <Invoices onOverdueChange={setOverdueCount} />
          : <ActiveView />
        }
      </main>
    </div>
  );
}
