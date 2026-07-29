import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import useStore from '../store/useStore';
import { LogoIcon } from '../components/Logo';

const ROLES = [
  {
    id: 'admin',
    icon: '👑',
    title: '1. Admin Dashboard',
    desc: 'Analytics, Menu Catalog, Tables & QR Codes',
    defaultUser: 'admin',
    defaultPass: 'admin123',
  },
  {
    id: 'staff',
    icon: '🧾',
    title: '2. Staff & Billing Counter',
    desc: 'Dining Tables, Take Order & Billing POS',
    defaultUser: 'staff',
    defaultPass: 'staff123',
  },
  {
    id: 'kitchen',
    icon: '👨‍🍳',
    title: '3. Kitchen Order Screen',
    desc: 'Live Order Cooking Cards & Kitchen Queue',
    defaultUser: 'kitchen',
    defaultPass: 'kitchen123',
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setErrorMsg('');
    const roleData = ROLES.find(r => r.id === role);
    setSelectedRole(role);
    setUsername(roleData.defaultUser);
    setPassword(roleData.defaultPass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.login(username, password);
      const { access, refresh, user } = res.data;
      login(user, access, refresh);
      toast.success(`Welcome, ${user.name}! 🎉`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/pos');
      else if (user.role === 'kitchen') navigate('/kitchen');
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || '⚠️ Invalid username or password. Please verify your credentials.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <LogoIcon size={58} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', fontFamily: "'Playfair Display', serif" }}>
              T CLOCK RESTO CAFE
            </div>
            <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginTop: 1 }}>
              Time for Tea, Time for Taste 🌴
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">Select Dashboard Role</label>
            {ROLES.map(role => (
              <div
                key={role.id}
                className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(role.id)}
              >
                <div className="role-card-icon">{role.icon}</div>
                <div>
                  <div className="role-card-title">{role.title}</div>
                  <div className="role-card-desc">{role.desc}</div>
                </div>
                {selectedRole === role.id && (
                  <div style={{ marginLeft: 'auto', color: 'var(--primary)', fontSize: 20 }}>✓</div>
                )}
              </div>
            ))}
          </div>

          {/* Username */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="Enter username"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter password"
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              💡 Demo: admin/admin123 · staff/staff123 · kitchen/kitchen123
            </div>
          </div>

          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', padding: '13px', fontSize: 14, marginTop: 4 }}
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner spinner-sm" /> Logging in...</>
            ) : (
              `Open ${selectedRole.toUpperCase()} Dashboard →`
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider" style={{ margin: '20px 0' }} />

        {/* Customer QR */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            Customer QR Self-Order View
          </div>
          <a
            href="/order/demo"
            className="btn btn-ghost w-full"
            style={{ justifyContent: 'center' }}
          >
            📱 View Customer Ordering Portal
          </a>
        </div>
      </div>
    </div>
  );
}
