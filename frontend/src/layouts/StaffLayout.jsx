import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar, { staffNav } from '../components/Sidebar';
import useStore from '../store/useStore';
import { orderApi } from '../api';

const pageTitles = {
  '/pos':          '🪑 Dining Tables',
  '/pos/order':    '📝 Take Order',
  '/pos/billing':  '🧾 Billing',
};

export default function StaffLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { selectedTable, addItemsMode, activeOrder, getCartCount, theme, toggleTheme } = useStore();
  const [billRequestedCount, setBillRequestedCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const title     = pageTitles[location.pathname] || 'POS';
  const cartCount = getCartCount();

  /* Poll for bill-requested tables every 20s */
  useEffect(() => {
    const fetchBillRequested = async () => {
      try {
        const res = await orderApi.getOrders({});
        const count = res.data.filter(o =>
          o.bill_requested || o.table_status === 'bill_requested'
        ).length;
        setBillRequestedCount(count);
      } catch { /* silent */ }
    };
    fetchBillRequested();
    const interval = setInterval(fetchBillRequested, 20000);
    return () => clearInterval(interval);
  }, []);

  const posNavItems = [
    { path: '/pos', label: 'Tables', icon: '🪑' },
    { path: '/pos/order', label: 'Take Order', icon: '📝' },
    { path: '/pos/billing', label: 'Billing', icon: '🧾' },
    { path: '/pos/online', label: 'Online Hub', icon: '🛵' },
    { path: '/kitchen', label: 'Kitchen KDS', icon: '👨‍🍳' },
  ];

  return (
    <div className="app-layout">
      <Sidebar
        navItems={staffNav}
        billRequestedCount={billRequestedCount}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="main-content">
        <header className="main-header">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            className="btn btn-ghost btn-sm mobile-menu-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            style={{ fontSize: 20, padding: '4px 8px' }}
            title="Menu"
          >
            ☰
          </button>

          {/* Left: page title + context */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
              {selectedTable && (
                <span>📍 {selectedTable.name}
                  {selectedTable.section ? ` · ${selectedTable.section}` : ''}
                </span>
              )}
              {addItemsMode && activeOrder && (
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  ➕ Adding to Order #{activeOrder.id}
                </span>
              )}
            </div>
          </div>

          {/* Right: badges */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Bill requested notification */}
            {billRequestedCount > 0 && (
              <button
                onClick={() => navigate('/pos/billing')}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)',
                  fontSize: 12, fontWeight: 700, color: '#a855f7',
                  cursor: 'pointer', animation: 'pulse 2s infinite',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
                title="Go to billing"
              >
                🔔 {billRequestedCount}
              </button>
            )}

            {/* Cart badge */}
            {cartCount > 0 && (
              <button
                onClick={() => navigate('/pos/order')}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)',
                  fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                  cursor: 'pointer',
                }}
              >
                🛒 {cartCount}
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                padding: '5px 12px', borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card2)', border: '1px solid var(--surface-border)',
                fontSize: 12, fontWeight: 700, color: 'var(--text)',
                cursor: 'pointer', transition: 'all var(--transition)',
              }}
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>

            {/* Role badge */}
            <div style={{
              padding: '5px 12px', borderRadius: 'var(--radius-full)',
              background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)',
              fontSize: 12, fontWeight: 700, color: 'var(--success)',
            }}>
              🟢 Staff POS
            </div>
          </div>
        </header>

        <Outlet />

        {/* Mobile Quick Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav">
          {posNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
