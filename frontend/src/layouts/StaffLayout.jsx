import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { staffNav } from '../components/Sidebar';
import useStore from '../store/useStore';

const pageTitles = {
  '/pos': 'Dining Tables',
  '/pos/order': 'Take Order',
  '/pos/billing': 'Billing',
  '/pos/history': 'Order History',
};

export default function StaffLayout() {
  const location = useLocation();
  const { selectedTable, getCartCount } = useStore();
  const title = pageTitles[location.pathname] || 'POS';
  const cartCount = getCartCount();

  return (
    <div className="app-layout">
      <Sidebar navItems={staffNav} />
      <div className="main-content">
        <header className="main-header">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{title}</div>
            {selectedTable && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                📍 {selectedTable.name} — {selectedTable.section}
              </div>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            {cartCount > 0 && (
              <div style={{
                padding: '5px 12px', borderRadius: 'var(--radius-full)',
                background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)',
                fontSize: 12, fontWeight: 700, color: 'var(--primary)',
              }}>
                🛒 {cartCount} items in cart
              </div>
            )}
            <div style={{
              padding: '5px 12px', borderRadius: 'var(--radius-full)',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              fontSize: 12, fontWeight: 700, color: 'var(--success)',
            }}>
              🟢 Staff POS
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
