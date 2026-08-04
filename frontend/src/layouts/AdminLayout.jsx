import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { adminNav } from '../components/Sidebar';

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/history': 'Order History',
  '/admin/menu': 'Menu Catalog',
  '/admin/tables': 'Tables & QR Codes',
  '/admin/staff': 'Staff Management',
  '/admin/settings': 'Settings & Configuration',
};

export default function AdminLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Admin';

  return (
    <div className="app-layout">
      <Sidebar navItems={adminNav} />
      <div className="main-content">
        <header className="main-header">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin Dashboard</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              padding: '5px 12px', borderRadius: 'var(--radius-full)',
              background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)',
              fontSize: 12, fontWeight: 700, color: 'var(--primary)',
            }}>
              👑 Owner Admin
            </div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
