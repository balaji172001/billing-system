import { useState, useEffect } from 'react';
import brand from './brand';
import { isLoggedIn, clearToken, verifyToken } from './utils/api';
import './App.css';

import Login         from './components/Login';
import Sidebar       from './components/Sidebar';
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
  const [view, setView]               = useState('dashboard');
  const [overdueCount, setOverdueCount] = useState(0);
  const [authed, setAuthed]           = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [username, setUsername]       = useState('');

  // Set browser tab title
  useEffect(() => { document.title = brand.title; }, []);

  // Check if there's a valid token on page load
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

  // Show blank while checking token
  if (authChecking) {
    return (
      <div className="app-auth-checking-container">
        <div className="spinner app-auth-spinner" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!authed) return <Login onLogin={handleLogin} />;

  // Main app
  const ActiveView = VIEWS[view] || Dashboard;

  return (
    <div className="app-shell">
      <Sidebar
        active={view}
        onNavigate={setView}
        overdueCount={overdueCount}
        username={username}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {view === 'invoices'
          ? <Invoices onOverdueChange={setOverdueCount} />
          : <ActiveView />
        }
      </main>
    </div>
  );
}
