import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardEdit,
  Calculator,
  ShoppingCart,
  LogOut,
} from 'lucide-react';
import { logout, getSession } from '../mockAuth';

const Layout = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    logout();
    if (setIsAuthenticated) {
      setIsAuthenticated(false);
    }
    navigate('/login');
  };

  const navLinks = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: '대시보드' },
    { to: '/inventory', icon: <ClipboardEdit size={20} />, label: '재고 입력' },
    { to: '/recommendation', icon: <Calculator size={20} />, label: '발주 추천' },
    { to: '/draft', icon: <ShoppingCart size={20} />, label: '발주서 초안' },
    { to: '/items', icon: <Package size={20} />, label: '상품 관리' },
    { to: '/vendors', icon: <Truck size={20} />, label: '거래처 관리' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Package size={24} color="var(--brand-primary)" />
          스마트 발주
        </div>
        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={link.to === '/'}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{session?.name}</span>
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>
              <LogOut size={16} /> 로그아웃
            </button>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
