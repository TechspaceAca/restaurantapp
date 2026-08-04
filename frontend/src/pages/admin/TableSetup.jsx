import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableApi, orderApi } from '../../api';
import toast from 'react-hot-toast';
import { getEnrichedTableStatus, ENRICHED_STATUS_INFO } from '../../utils/tableUtils';
import AdminBillModal from '../../components/AdminBillModal';

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
  const qrUrl = `${window.location.origin}/#/order/${table.qr_token}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&margin=12`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">QR Code — {table.name}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ textAlign: 'center', padding: '12px 0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: '#ffffff', padding: 16, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <img src={qrImageUrl} alt="QR Code" style={{ width: 200, height: 200, display: 'block' }} />
          </div>
        </div>
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
  const [liveOrders, setLiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableModal, setTableModal] = useState(null);
  const [qrModal, setQrModal] = useState(null);
  const [billModal, setBillModal] = useState(null);
  const [filterSection, setFilterSection] = useState('all');
  const navigate = useNavigate();

  useEffect(() => { fetchTables(); }, []);

  const fetchTables = async () => {
    try {
      const activeStatuses = ['pending', 'placed', 'confirmed', 'preparing', 'cooking', 'ready', 'served'];
      const statusPromises = activeStatuses.map(status => orderApi.getOrders({ status }));

      const [res, ...ordersResponses] = await Promise.all([
        tableApi.getTables(),
        ...statusPromises
      ]);
      setTables(res.data);
      const loData = ordersResponses.flatMap(r => Array.isArray(r.data) ? r.data : r.data?.results || []);
      setLiveOrders(loData);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(table => {
            const enrichedStatus = getEnrichedTableStatus(table, liveOrders);
            const sc = ENRICHED_STATUS_INFO[enrichedStatus] || ENRICHED_STATUS_INFO.available;
            
            return (
              <div 
                key={table.id} 
                style={{ 
                  display: 'flex',
                  overflow: 'hidden',
                  background: 'var(--bg-card)',
                  borderRadius: 16,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  minHeight: 140,
                  border: '1px solid var(--border)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Left Color Block */}
                <div style={{
                  width: 90,
                  background: `linear-gradient(145deg, ${sc.color}, ${sc.dark})`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  borderRight: '2px dashed rgba(255,255,255,0.25)',
                  padding: 10,
                  position: 'relative'
                }}>
                  {/* Subtle inner shadow for depth */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2)' }} />
                  
                  <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)', zIndex: 1 }}>
                    {table.number.replace(/\D/g, '') || table.number}
                  </div>
                  <div style={{ 
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', marginTop: 10, 
                    textAlign: 'center', textTransform: 'uppercase', zIndex: 1,
                    background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 99
                  }}>
                    {sc.label}
                  </div>
                </div>

                {/* Right Content Block */}
                <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>{table.name}</div>
                      <span style={{ 
                        background: 'var(--bg-card2)', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4, textTransform: 'capitalize', color: 'var(--text-muted)'
                      }}>
                        {SECTION_ICONS[table.section?.toLowerCase()] || '📍'} {table.section}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ filter: 'grayscale(1)', opacity: 0.7 }}>👥</span> {table.capacity} Seats
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 16 }}>
                    {(enrichedStatus === 'served' || enrichedStatus === 'billing' || enrichedStatus === 'bill_requested') && (
                      <button 
                        className="btn btn-primary btn-sm" 
                        style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8 }}
                        onClick={() => setBillModal(table)}
                        title="View Bill"
                      >
                        🧾 Bill
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, background: 'var(--bg-card2)', color: 'var(--text)' }}
                      onClick={() => setQrModal(table)}
                      title="View QR Code"
                    >
                      📱 QR
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, background: 'var(--bg-card2)', color: 'var(--text)' }}
                      onClick={() => setTableModal(table)}
                      title="Edit Table"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ padding: '6px 10px', fontSize: 12, borderRadius: 8, background: 'var(--bg-card2)' }}
                      onClick={() => handleDelete(table.id)}
                      title="Delete Table"
                    >
                      <span style={{ color: 'var(--danger)' }}>🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
      
      {/* Bill Preview Modal */}
      {billModal && (
        <AdminBillModal table={billModal} onClose={() => setBillModal(null)} />
      )}
    </div>
  );
}
