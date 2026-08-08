import { useState, useEffect } from 'react';
import { authApi } from '../../api';
import toast from 'react-hot-toast';
import RoleManagementModal from '../../components/RoleManagementModal';

function StaffModal({ staff, roles, onClose, onSave }) {
  const [form, setForm] = useState({
    username: staff?.username || '', first_name: staff?.first_name || '',
    last_name: staff?.last_name || '', email: staff?.email || '',
    custom_role: staff?.custom_role || '', phone: staff?.phone || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!form.custom_role && roles.length > 0 && !staff?.id) {
      setForm(f => ({ ...f, custom_role: roles[0].id }));
    }
  }, [roles, form.custom_role, staff]);

  const handleSave = async () => {
    if (!form.username) { toast.error('Username is required'); return; }
    if (!form.custom_role) { toast.error('Role is required'); return; }
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
            <select className="form-select" value={form.custom_role} onChange={e => setForm(f => ({ ...f, custom_role: e.target.value }))}>
              {roles.length === 0 ? <option value="">No roles available (Create one first)</option> : null}
              {roles.map(r => <option key={r.id} value={r.id}>{r.name} ({r.base_access})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Password {staff?.id ? '(leave blank to keep)' : '*'}</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving || roles.length === 0}>
            {saving ? 'Saving...' : 'Save Staff'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  useEffect(() => { 
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        authApi.getStaff(),
        authApi.getRoles()
      ]);
      setStaff(staffRes.data.filter(s => s.role !== 'admin'));
      setRoles(rolesRes.data);
    } catch { 
      toast.error('Failed to load data'); 
    }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    try { await authApi.deleteStaff(id); toast.success('Staff removed'); fetchData(); }
    catch { toast.error('Failed to remove staff'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ transform: 'translateY(-2px)' }}>👥</span> Staff Management
          </div>
          <div className="page-subtitle">{staff.length} users registered</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setRoleModalOpen(true)}>Manage Roles</button>
          <button className="btn btn-primary" onClick={() => setModal('new')}>+ Add Staff</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>Loading staff...</p></div>
      ) : (
        <div className="card mobile-table-card" style={{ padding: 0, overflow: 'hidden' }}>
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
                const fallbackNames = { admin: 'Admin / Owner', staff: 'Staff / Cashier', kitchen: 'Kitchen Cook' };
                const roleName = s.custom_role_data?.name || fallbackNames[s.role] || 'Unknown';
                
                return (
                  <tr key={s.id}>
                    <td data-label="Name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>
                          {(s.first_name || s.username)[0].toUpperCase()}
                        </div>
                          <span style={{ fontWeight: 600 }}>
                            {s.first_name || s.last_name ? `${s.first_name} ${s.last_name}`.trim() : s.username}
                          </span>
                      </div>
                    </td>
                    <td data-label="Username" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>@{s.username}</td>
                    <td data-label="Role">
                      <span className="badge" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                        {roleName}
                      </span>
                    </td>
                    <td data-label="Email" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.email || '—'}</td>
                    <td data-label="Phone" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.phone || '—'}</td>
                    <td className="item-actions-td" data-label="">
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
          roles={roles}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchData(); }}
        />
      )}

      {roleModalOpen && (
        <RoleManagementModal 
          onClose={() => {
            setRoleModalOpen(false);
            fetchData();
          }} 
        />
      )}
    </div>
  );
}
