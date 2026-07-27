import { useState, useEffect } from 'react';
import { tableApi } from '../../api';
import toast from 'react-hot-toast';

const DEFAULT_SECTIONS = ['indoor', 'outdoor', 'terrace', 'private'];
const SECTION_ICONS = { indoor: '🏠', outdoor: '🌳', terrace: '🌅', private: '🔒' };

function TableModal({ table, existingSections = [], onClose, onSave }) {
  const isExistingCustom = table?.section && !DEFAULT_SECTIONS.includes(table.section.toLowerCase());

  const [form, setForm] = useState({
    number: table?.number || '',
    name: table?.name || '',
    capacity: table?.capacity || 4,
    section: isExistingCustom ? '__CUSTOM__' : (table?.section || 'indoor'),
    customSection: isExistingCustom ? table.section : '',
    is_active: table?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  // Combine default sections + any extra sections from existing tables
  const availableSections = Array.from(
    new Set([...DEFAULT_SECTIONS, ...existingSections.filter(Boolean)])
  );

  const handleSectionSelect = (val) => {
    if (val === '__CUSTOM__') {
      setForm(f => ({ ...f, section: '__CUSTOM__', customSection: f.customSection || '' }));
    } else {
      setForm(f => ({ ...f, section: val }));
    }
  };

  const handleSave = async () => {
    if (!form.number || !form.name) {
      toast.error('Table number and name required');
      return;
    }

    const finalSection = form.section === '__CUSTOM__'
      ? form.customSection.trim()
      : form.section;

    if (!finalSection) {
      toast.error('Please specify a section name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        number: form.number,
        name: form.name,
        capacity: form.capacity,
        section: finalSection,
        is_active: form.is_active,
      };

      if (table?.id) await tableApi.updateTable(table.id, payload);
      else await tableApi.createTable(payload);

      toast.success(`Table ${table?.id ? 'updated' : 'created'}!`);
      onSave();
    } catch (e) {
      toast.error(e.response?.data?.number?.[0] || e.response?.data?.section?.[0] || 'Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{table?.id ? 'Edit Table' : 'Add New Table'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">TABLE NUMBER *</label>
            <input
              className="form-input"
              value={form.number}
              onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
              placeholder="T-01, T-02..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">DISPLAY NAME *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Table 1, VIP Table..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">SEATS</label>
            <input
              className="form-input"
              type="number"
              value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))}
              min={1}
              max={50}
            />
          </div>

          <div className="form-group">
            <label className="form-label">SECTION</label>
            <select
              className="form-select"
              value={form.section}
              onChange={e => handleSectionSelect(e.target.value)}
            >
              {availableSections.map(s => {
                const icon = SECTION_ICONS[s.toLowerCase()] || '📍';
                const label = s.charAt(0).toUpperCase() + s.slice(1);
                return <option key={s} value={s}>{icon} {label}</option>;
              })}
              <option value="__CUSTOM__">➕ Add Custom Section...</option>
            </select>
          </div>
        </div>

        {/* Custom Section Input field when __CUSTOM__ is selected */}
        {form.section === '__CUSTOM__' && (
          <div className="form-group" style={{ marginTop: 10 }}>
            <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              ENTER NEW SECTION NAME *
            </label>
            <input
              className="form-input"
              value={form.customSection}
              onChange={e => setForm(f => ({ ...f, customSection: e.target.value }))}
              placeholder="e.g. AC Hall, Rooftop, Garden, Family VIP..."
              autoFocus
            />
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, margin: '14px 0 18px' }}>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
          />
          ✅ Table is Active
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : (table?.id ? 'Update Table' : 'Save Table')}
          </button>
        </div>
      </div>
    </div>
  );
}

function QRModal({ table, onClose }) {
  const qrUrl = `${window.location.origin}/order/${table.qr_token}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">QR Code — {table.name}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <img src={qrImageUrl} alt="QR Code" style={{ width: 200, height: 200, margin: '0 auto 16px', display: 'block', borderRadius: 12 }} />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: 16, padding: '8px 12px', background: 'var(--bg-card2)', borderRadius: 8 }}>
          {qrUrl}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary flex-1" onClick={() => { navigator.clipboard.writeText(qrUrl); toast.success('URL copied!'); }}>
            📋 Copy URL
          </button>
          <button className="btn btn-primary flex-1" onClick={() => window.open(qrImageUrl, '_blank')}>
            ⬇️ Download QR
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TableSetup() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableModal, setTableModal] = useState(null);
  const [qrModal, setQrModal] = useState(null);
  const [filterSection, setFilterSection] = useState('all');

  useEffect(() => { fetchTables(); }, []);

  const fetchTables = async () => {
    try {
      const res = await tableApi.getTables();
      setTables(res.data);
    } catch { toast.error('Failed to load tables'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this table?')) return;
    try {
      await tableApi.deleteTable(id);
      toast.success('Table deleted');
      fetchTables();
    } catch { toast.error('Failed to delete table'); }
  };

  // Collect all sections (defaults + any custom section in use)
  const existingSections = Array.from(new Set(tables.map(t => t.section).filter(Boolean)));
  const allSections = Array.from(new Set([...DEFAULT_SECTIONS, ...existingSections]));
  const filterTabs = ['all', ...allSections];

  const filtered = filterSection === 'all'
    ? tables
    : tables.filter(t => t.section?.toLowerCase() === filterSection.toLowerCase());

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">🪑 Tables & QR Codes</div>
          <div className="page-subtitle">{tables.length} tables configured</div>
        </div>
        <button className="btn btn-primary" onClick={() => setTableModal('new')}>+ Add Table</button>
      </div>

      {/* Dynamic Section Filters */}
      <div className="category-tabs mb-4" style={{ flexWrap: 'wrap', gap: 6 }}>
        {filterTabs.map(s => {
          const icon = SECTION_ICONS[s.toLowerCase()] || '📍';
          const label = s === 'all' ? '🪑 All Tables' : `${icon} ${s.charAt(0).toUpperCase() + s.slice(1)}`;
          return (
            <button
              key={s}
              className={`cat-tab ${filterSection === s ? 'active' : ''}`}
              onClick={() => setFilterSection(s)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>Loading tables...</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {filtered.map(table => (
            <div key={table.id} className="card card-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: table.status === 'available' ? 'var(--success)' : table.status === 'occupied' ? 'var(--danger)' : 'var(--warning)' }}>
                  {table.number}
                </div>
                <span className="badge badge-muted" style={{ alignSelf: 'flex-start', textTransform: 'capitalize' }}>
                  {SECTION_ICONS[table.section?.toLowerCase()] || '📍'} {table.section}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{table.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                👥 {table.capacity} seats
              </div>
              <span className={`badge status-${table.status}`} style={{ marginBottom: 14, display: 'inline-flex' }}>
                {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm flex-1" onClick={() => setQrModal(table)}>
                  📱 QR Code
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setTableModal(table)}>✏️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(table.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1' }}>
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🪑</div>
                  <div className="empty-state-title">No tables in this section</div>
                  <div className="empty-state-text">Add dining tables to get started</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tableModal !== null && (
        <TableModal
          table={tableModal === 'new' ? null : tableModal}
          existingSections={existingSections}
          onClose={() => setTableModal(null)}
          onSave={() => { setTableModal(null); fetchTables(); }}
        />
      )}
      {qrModal && <QRModal table={qrModal} onClose={() => setQrModal(null)} />}
    </div>
  );
}
