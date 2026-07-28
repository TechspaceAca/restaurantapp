import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { LogoFull } from './Logo';

const adminNav = [
  { section: 'Overview' },
  { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { section: 'Management' },
  { path: '/admin/menu', label: 'Menu Catalog', icon: '🍽️' },
  { path: '/admin/tables', label: 'Tables & QR', icon: '🪑' },
  { path: '/admin/staff', label: 'Staff Users', icon: '👥' },
  { section: 'Configuration' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

const staffNav = [
  { section: 'POS' },
  { path: '/pos', label: 'Dining Tables', icon: '🪑', exact: true },
  { path: '/pos/order', label: 'Take Order', icon: '📝' },
  { path: '/pos/billing', label: 'Billing', icon: '🧾' },
  { path: '/pos/history', label: 'Order History', icon: '📋' },
];

const kitchenNav = [
  { section: 'Kitchen' },
  { path: '/kitchen', label: 'KDS Screen', icon: '👨‍🍳' },
];

function Sidebar({ navItems, billRequestedCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ padding: '16px 14px' }}>
        <LogoFull size={44} showSubtitle={false} />
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={i} className="sidebar-section-label">{item.section}</div>;
          }
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive(item) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {/* Bill-requested notification dot on Billing nav item */}
              {item.path === '/pos/billing' && billRequestedCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#a855f7',
                  color: '#fff',
                  borderRadius: '9999px',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '1px 6px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                  {billRequestedCount}
                </span>
              )}
              {item.badge && item.path !== '/pos/billing' && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {(user?.name || user?.username || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || user?.username}
            </div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '16px', padding: '4px',
              transition: 'color 0.2s',
            }}
            title="Logout"
            onMouseOver={e => e.target.style.color = 'var(--danger)'}
            onMouseOut={e => e.target.style.color = 'var(--text-muted)'}
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}

export { adminNav, staffNav, kitchenNav };
export default Sidebar;
