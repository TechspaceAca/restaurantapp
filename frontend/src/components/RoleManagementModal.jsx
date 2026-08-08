import { useState, useEffect } from 'react';
import { authApi } from '../api';
import toast from 'react-hot-toast';

const BASE_ACCESS_CHOICES = [
  { value: 'staff', label: 'Staff Dashboard (Billing & Orders)' },
  { value: 'kitchen', label: 'Kitchen Dashboard (KDS)' },
];

export default function RoleManagementModal({ onClose, onRoleUpdated }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    base_access: 'staff',
  });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data } = await authApi.getRoles();
      setRoles(data);
    } catch (err) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEdit = (role) => {
    setEditingRole(role);
    setForm({ name: role.name, base_access: role.base_access });
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setForm({ name: '', base_access: 'staff' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Role name is required');
    try {
      if (editingRole) {
        await authApi.updateRole(editingRole.id, form);
        toast.success('Role updated');
      } else {
        await authApi.createRole(form);
        toast.success('Role created');
      }
      handleCancelEdit();
      fetchRoles();
      if (onRoleUpdated) onRoleUpdated();
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Failed to save role');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this role? Users assigned to this role will lose their custom role.')) return;
    try {
      await authApi.deleteRole(id);
      toast.success('Role deleted');
      fetchRoles();
      if (onRoleUpdated) onRoleUpdated();
    } catch (err) {
      toast.error('Failed to delete role');
    }
  };

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Manage Custom Roles</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '16px', background: 'var(--surface-light)', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Role Name *</label>
              <input 
                className="form-input" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="e.g. Senior Waiter"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Base Dashboard Access *</label>
              <select 
                className="form-select" 
                value={form.base_access} 
                onChange={e => setForm({...form, base_access: e.target.value})}
              >
                {BASE_ACCESS_CHOICES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
            {editingRole && <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>}
            <button type="submit" className="btn btn-primary">{editingRole ? 'Save Changes' : 'Create Role'}</button>
          </div>
        </form>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Base Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Loading roles...</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>No custom roles created.</td></tr>
              ) : roles.map(role => (
                <tr key={role.id}>
                  <td data-label="Role Name" style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    {role.name}
                  </td>
                  <td data-label="Base Access" style={{ textTransform: 'capitalize' }}>{role.base_access}</td>
                  <td className="item-actions-td" data-label="" style={{ borderBottom: 'none' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', width: '100%' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(role)}>✏️ Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(role.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
