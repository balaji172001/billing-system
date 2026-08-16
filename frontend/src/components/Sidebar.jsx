import { LayoutDashboard, FileText, Users, CreditCard, RefreshCcw, Settings, Zap, LogOut } from 'lucide-react';
import brand from '../brand';
import './Sidebar.css';

const navItems = [
  { id: 'dashboard',      label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'invoices',       label: 'Invoices',     icon: FileText },
  { id: 'clients',        label: 'Clients',      icon: Users },
  { id: 'payments',       label: 'Payments',     icon: CreditCard },
  { id: 'subscriptions',  label: 'Recurring',    icon: RefreshCcw },
  { id: 'settings',       label: 'Settings',     icon: Settings },
];

export default function Sidebar({ active, onNavigate, overdueCount, username, onLogout }) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Zap size={18} />
        </div>
        <span className="sidebar-brand-name">{brand.name}</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`nav-${id}`}
            className={`nav-item ${active === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={16} />
            {label}
            {id === 'invoices' && overdueCount > 0 && (
              <span className="nav-badge">{overdueCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-user-section">
        {/* Logged-in user */}
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {(username || 'A')[0]}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {username || 'Admin'}
            </div>
            <div className="sidebar-user-role">Administrator</div>
          </div>
        </div>

        {/* Logout */}
        <button
          id="btn-logout"
          className="nav-item sidebar-logout-btn"
          onClick={onLogout}
        >
          <LogOut size={14} /> Sign Out
        </button>

        <div className="sidebar-footer">
          {brand.name} {brand.version}<br />
          <span className="sidebar-footer-tagline">{brand.tagline}</span>
        </div>
      </div>
    </aside>
  );
}
