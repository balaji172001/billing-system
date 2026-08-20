import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  RefreshCcw,
  Settings,
  Zap,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import brand from '../brand';
import './MobileNav.css';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'subscriptions', label: 'Recurring', icon: RefreshCcw },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function MobileNav({ active, onNavigate, overdueCount, username, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavClick = (id) => {
    onNavigate(id);
    setDrawerOpen(false);
  };

  const activeItem = navItems.find((item) => item.id === active) || navItems[0];

  return (
    <>
      {/* Sticky Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <div className="mobile-header-logo">
            <Zap size={16} />
          </div>
          <div className="mobile-header-titles">
            <span className="mobile-header-brand">{brand.name}</span>
            <span className="mobile-header-view">{activeItem.label}</span>
          </div>
        </div>

        <div className="mobile-header-right">
          {overdueCount > 0 && (
            <span className="mobile-overdue-chip" onClick={() => handleNavClick('invoices')}>
              {overdueCount} Overdue
            </span>
          )}
          <button
            className="mobile-menu-btn"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="Toggle navigation menu"
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Slide-over Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-user">
                <div className="mobile-drawer-avatar">{(username || 'A')[0]}</div>
                <div>
                  <div className="mobile-drawer-username">{username || 'Admin'}</div>
                  <div className="mobile-drawer-user-role">Administrator • Mobile Mode</div>
                </div>
              </div>
              <button className="mobile-drawer-close" onClick={() => setDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <nav className="mobile-drawer-nav">
              <span className="mobile-drawer-section-title">Navigation</span>
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`mobile-drawer-item ${active === id ? 'active' : ''}`}
                  onClick={() => handleNavClick(id)}
                >
                  <div className="mobile-drawer-item-left">
                    <Icon size={18} />
                    <span>{label}</span>
                  </div>
                  {id === 'invoices' && overdueCount > 0 ? (
                    <span className="mobile-drawer-badge">{overdueCount}</span>
                  ) : (
                    <ChevronRight size={14} className="mobile-drawer-arrow" />
                  )}
                </button>
              ))}
            </nav>

            <div className="mobile-drawer-footer">
              <button className="mobile-drawer-logout-btn" onClick={onLogout}>
                <LogOut size={16} /> Sign Out
              </button>
              <div className="mobile-drawer-app-info">
                {brand.name} {brand.version} — Mobile Separate Design
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-bar">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              className={`mobile-bottom-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(id)}
            >
              <div className="mobile-bottom-icon-wrap">
                <Icon size={18} />
                {id === 'invoices' && overdueCount > 0 && (
                  <span className="mobile-bottom-dot" />
                )}
              </div>
              <span className="mobile-bottom-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
