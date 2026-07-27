import { useState, useEffect } from 'react';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'admin', label: '👑 Admin / Owner', color: 'var(--primary)' },
  { value: 'staff', label: '🧾 Staff / Cashier', color: 'var(--success)' },
  { value: 'kitchen', label: '👨‍🍳 Kitchen Cook', color: 'var(--accent)' },
];

function StaffModal({ staff, onClose, onSave }) {
  const [form, setForm] = useState({
    username: staff?.username || '', first_name: staff?.first_name || '',
    last_name: staff?.last_name || '', email: staff?.email || '',
    role: staff?.role || 'staff', phone: staff?.phone || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.username) { toast.error('Username is required'); return; }
    if (!staff?.id && !form.password) { toast.error('Password is required for new users'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (staff?.id) await authApi.updateStaff(staff.id, payload);
      else await authApi.createStaff(payload);
      toast.success(`Staff ${staff?.id ? 'updated' : 'created'}!`);
      onSave();
    } catch (e) {
      const err = e.response?.data;
      toast.error(err?.username?.[0] || err?.detail || 'Failed to save staff');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{staff?.id ? 'Edit' : 'Add'} Staff User</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Rahul" />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Sharma" />
          </div>
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="rahul_staff" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Role *</label>
            <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Password {staff?.id ? '(leave blank to keep)' : '*'}</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Staff'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const res = await authApi.getStaff();
      setStaff(res.data);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    try { await authApi.deleteStaff(id); toast.success('Staff removed'); fetchStaff(); }
    catch { toast.error('Failed to remove staff'); }
  };

  const roleInfo = (role) => ROLES.find(r => r.value === role);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">👥 Staff Management</div>
          <div className="page-subtitle">{staff.length} users registered</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ Add Staff</button>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>Loading staff...</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => {
                const ri = roleInfo(s.role);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>
                          {(s.first_name || s.username)[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>@{s.username}</td>
                    <td>
                      <span className="badge" style={{ background: ri?.color + '22', color: ri?.color }}>
                        {ri?.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.email || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.phone || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal(s)}>✏️ Edit</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {staff.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No staff users yet</div>
              <div className="empty-state-text">Add your first staff member</div>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <StaffModal
          staff={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchStaff(); }}
        />
      )}
    </div>
  );
}
