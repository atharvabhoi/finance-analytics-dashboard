import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeftRight, LayoutDashboard, LogOut, Menu, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isTransactions = location.pathname.startsWith('/transactions');

  return (
    <div className="shell">
      {sidebarOpen ? <button className="sidebar-backdrop" type="button" aria-label="Close menu" onClick={() => setSidebarOpen(false)} /> : null}

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Penta</span>
          <button className="icon-button sidebar-close" type="button" aria-label="Close menu" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard">
          <NavLink to="/" className="nav-item" end onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className="nav-item" onClick={() => setSidebarOpen(false)}>
            <ArrowLeftRight size={18} />
            Transactions
          </NavLink>
        </nav>

        <button className="nav-item logout" type="button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <button className="icon-button menu-toggle" type="button" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div>
            <p className="eyebrow">{isTransactions ? 'Records' : 'Overview'}</p>
            <h1>{isTransactions ? 'Transactions' : 'Dashboard'}</h1>
          </div>
          <div className="user-chip">
            <span className="user-avatar" aria-hidden="true">
              <Wallet size={16} />
            </span>
            <span>{user?.email}</span>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
