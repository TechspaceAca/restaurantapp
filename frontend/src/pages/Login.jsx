import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  },
  {
    id: 'staff',
    icon: '🧾',
    title: '2. Staff & Billing Counter',
    desc: 'Dining Tables, Take Order & Billing POS',
  },
  {
    id: 'kitchen',
    icon: '👨‍🍳',
    title: '3. Kitchen Order Screen',
    desc: 'Live Order Cooking Cards & Kitchen Queue',
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setErrorMsg('');
    setSelectedRole(role);
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
      else if (user.role === 'kitchen') navigate('/kitchen');
      else navigate('/pos');
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
      <div className="login-card" style={{ padding: '24px 32px' }}>
        {/* Logo */}
        <div className="login-logo" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <LogoIcon size={52} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', fontFamily: "'Playfair Display', serif" }}>
              T CLOCK RESTO CAFE
            </div>
            <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 1 }}>
              Time for Tea, Time for Taste 🌴
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Select Dashboard Role</label>
            {ROLES.map(role => (
              <div
                key={role.id}
                className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(role.id)}
                style={{ padding: '10px 14px', marginBottom: 8 }}
              >
                <div className="role-card-icon" style={{ fontSize: 20 }}>{role.icon}</div>
                <div>
                  <div className="role-card-title">{role.title}</div>
                  <div className="role-card-desc">{role.desc}</div>
                </div>
                {selectedRole === role.id && (
                  <div style={{ marginLeft: 'auto', color: 'var(--primary)', fontSize: 18 }}>✓</div>
                )}
              </div>
            ))}
          </div>

          {/* Username */}
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ marginBottom: 4 }}>Username</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="Enter username"
              style={{ padding: '8px 12px' }}
            />
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ marginBottom: 4 }}>Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              style={{ padding: '8px 12px' }}
            />
          </div>

          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              marginTop: 8,
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
            style={{ justifyContent: 'center', padding: '10px', fontSize: 14, marginTop: 4 }}
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
        <div className="divider" style={{ margin: '14px 0' }} />

        {/* Customer QR */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
            Customer QR Self-Order View
          </div>
          <Link
            to="/order/demo"
            className="btn btn-ghost w-full"
            style={{ justifyContent: 'center', padding: '8px', fontSize: 13 }}
          >
            📱 View Customer Ordering Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
