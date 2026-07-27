import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tableApi, orderApi } from '../../api';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

/* ── Status colours ──────────────────────────────────────────── */
const STATUS_COLORS = {
  available:       { bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.35)',  num: '#22c55e', badge: 'badge-success' },
  occupied:        { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.40)',  num: '#ef4444', badge: 'badge-danger'  },
  bill_requested:  { bg: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.50)', num: '#a855f7', badge: 'badge-purple'  },
  reserved:        { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.35)', num: '#f59e0b', badge: 'badge-warning' },
  cleaning:        { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.30)', num: '#3b82f6', badge: 'badge-info'    },
};

const STATUS_LABELS = {
  available:      'Available',
  occupied:       'Occupied',
  bill_requested: 'Bill Requested',
  reserved:       'Reserved',
  cleaning:       'Cleaning',
};

const SECTION_ICONS = { indoor: '🏠', outdoor: '🌳', terrace: '🌅', private: '🔒' };

/* ── QR Code Modal ───────────────────────────────────────────── */
function QRModal({ table, onClose }) {
  const qrUrl = `${window.location.origin}/order/${table.qr_token}`;
  // Use Google Charts QR API (no external lib needed)
  const qrImgSrc = `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(qrUrl)}&choe=UTF-8`;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl);
    toast.success('Link copied!');
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=400,height=500');
    win.document.write(`
      <html><head><title>QR — ${table.name}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 30px; }
        h2 { margin: 0 0 6px; font-size: 22px; }
        p  { color: #666; font-size: 13px; margin: 0 0 16px; }
        img { border: 2px solid #ddd; border-radius: 12px; padding: 8px; }
        .url { font-size: 11px; color: #888; word-break: break-all; margin-top: 12px; }
      </style></head><body>
      <h2>🍽️ T Clock — ${table.name}</h2>
      <p>${table.capacity} seats • Scan to order</p>
      <img src="${qrImgSrc}" alt="QR Code" />
      <div class="url">${qrUrl}</div>
      </body></html>
    `);
    win.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">📱 QR Code — {table.name}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <img
            src={qrImgSrc}
            alt="QR Code"
            style={{ borderRadius: 12, border: '2px solid var(--border)', padding: 8, width: 220, height: 220 }}
            onError={e => { e.target.style.display='none'; }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, wordBreak: 'break-all', padding: '0 8px' }}>
            {qrUrl}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary flex-1" onClick={handleCopy} style={{ justifyContent: 'center' }}>
            📋 Copy Link
          </button>
          <button className="btn btn-primary flex-1" onClick={handlePrint} style={{ justifyContent: 'center' }}>
            🖨️ Print QR
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Quick Status Modal ──────────────────────────────────────── */
function StatusModal({ table, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);

  const OPTIONS = [
    { status: 'available', label: '✅ Mark Available', color: 'var(--success)' },
    { status: 'cleaning',  label: '🧹 Mark Cleaning',  color: 'var(--info)'    },
    { status: 'reserved',  label: '📌 Mark Reserved',  color: 'var(--warning)' },
  ].filter(o => o.status !== table.status);

  const handleSet = async (status) => {
    setLoading(true);
    try {
      await tableApi.updateStatus(table.id, status);
      toast.success(`Table marked as ${STATUS_LABELS[status]}`);
      onUpdated();
      onClose();
    } catch {
      toast.error('Failed to update status');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 300 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">⚙️ {table.name} — Change Status</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {OPTIONS.map(o => (
            <button
              key={o.status}
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', color: o.color, borderColor: o.color, background: 'transparent' }}
              onClick={() => handleSet(o.status)}
              disabled={loading}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function TablesView() {
  const [tables, setTables]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [section, setSection]         = useState('all');
  const [qrModal, setQrModal]         = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [loadingTable, setLoadingTable] = useState(null); // id of table being navigated

  const { enterNewOrderMode, enterAddItemsMode } = useStore();
  const navigate = useNavigate();

  const fetchTables = useCallback(async () => {
    try {
      const res = await tableApi.getTables();
      setTables(res.data);
    } catch { toast.error('Failed to load tables'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  /* Smart click: occupied → add-items mode; else → new order */
  const handleTableClick = async (table) => {
    setLoadingTable(table.id);
    try {
      if (['occupied', 'bill_requested'].includes(table.status) && table.active_order_id) {
        // Fetch the active order, then enter add-items mode
        const res = await orderApi.getActiveTableOrder(table.id);
        if (res.data && res.data.id) {
          enterAddItemsMode(table, res.data);
        } else {
          enterNewOrderMode(table);
        }
      } else {
        enterNewOrderMode(table);
      }
      navigate('/pos/order');
    } catch {
      toast.error('Failed to load table order');
      enterNewOrderMode(table);
      navigate('/pos/order');
    } finally { setLoadingTable(null); }
  };

  const handleBillRequested = async (e, table) => {
    e.stopPropagation();
    if (table.active_order_id) {
      // Go straight to billing for this order
      navigate('/pos/billing');
    }
  };

  const sections = ['all', ...new Set(tables.map(t => t.section).filter(Boolean))];
  const filtered = section === 'all' ? tables : tables.filter(t => t.section === section);

  const counts = {
    available:      tables.filter(t => t.status === 'available').length,
    occupied:       tables.filter(t => t.status === 'occupied').length,
    bill_requested: tables.filter(t => t.status === 'bill_requested').length,
  };

  return (
    <div className="page-content fade-in">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title">🪑 Dining Tables</div>
          <div className="page-subtitle" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ {counts.available} free</span>
            <span style={{ color: 'var(--danger)',  fontWeight: 600 }}>🔴 {counts.occupied} occupied</span>
            {counts.bill_requested > 0 && (
              <span style={{ color: '#a855f7', fontWeight: 700, animation: 'pulse 1.5s infinite' }}>
                🔔 {counts.bill_requested} bill requested
              </span>
            )}
            <span style={{ color: 'var(--text-muted)' }}>{tables.length} total</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchTables}>↻ Refresh</button>
      </div>

      {/* ── Section Filter ── */}
      <div className="category-tabs mb-4">
        {sections.map(s => (
          <button key={s} className={`cat-tab ${section === s ? 'active' : ''}`} onClick={() => setSection(s)}>
            {s === 'all' ? '🪑 All' : `${SECTION_ICONS[s] || '📍'} ${s.charAt(0).toUpperCase() + s.slice(1)}`}
          </button>
        ))}
      </div>

      {/* ── Tables Grid ── */}
      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>Loading tables...</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14 }}>
          {filtered.map(table => {
            const style   = STATUS_COLORS[table.status] || STATUS_COLORS.available;
            const isLoading = loadingTable === table.id;
            const isBillReq = table.status === 'bill_requested';

            return (
              <div
                key={table.id}
                onClick={() => !isLoading && handleTableClick(table)}
                style={{
                  background: style.bg,
                  border: `2px solid ${style.border}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 14px 14px',
                  cursor: isLoading ? 'wait' : 'pointer',
                  transition: 'all var(--transition)',
                  userSelect: 'none',
                  position: 'relative',
                  boxShadow: isBillReq ? '0 0 0 3px rgba(168,85,247,0.25)' : 'none',
                }}
                onMouseOver={e => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseOut={e  => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Top-right action icons */}
                <div
                  style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* QR Code button */}
                  <button
                    title="Show QR Code"
                    onClick={() => setQrModal(table)}
                    style={{
                      background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 6,
                      width: 26, height: 26, cursor: 'pointer', fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >📱</button>
                  {/* Status change button */}
                  <button
                    title="Change status"
                    onClick={() => setStatusModal(table)}
                    style={{
                      background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: 6,
                      width: 26, height: 26, cursor: 'pointer', fontSize: 13,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >⚙️</button>
                </div>

                {/* Table number */}
                <div style={{ fontSize: 34, fontWeight: 900, color: style.num, lineHeight: 1.1 }}>
                  {isLoading ? <div className="spinner spinner-sm" style={{ margin: '0 auto' }} /> : table.number}
                </div>

                {/* Table name & capacity */}
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginTop: 4 }}>{table.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {SECTION_ICONS[table.section] || '📍'} {table.capacity} seats
                </div>

                {/* Status badge */}
                <div style={{ marginTop: 10 }}>
                  <span className={`badge ${style.badge}`}>
                    {STATUS_LABELS[table.status] || table.status}
                  </span>
                </div>

                {/* Active order info */}
                {table.active_order_id && (
                  <div style={{ fontSize: 10, color: 'var(--warning)', marginTop: 6, fontWeight: 600 }}>
                    🔥 Order #{table.active_order_id}
                  </div>
                )}

                {/* Bill-requested CTA */}
                {isBillReq && (
                  <button
                    className="btn btn-sm"
                    onClick={e => handleBillRequested(e, table)}
                    style={{
                      marginTop: 10, width: '100%', justifyContent: 'center',
                      background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)',
                      color: '#a855f7', fontWeight: 700, fontSize: 11, padding: '5px 8px',
                    }}
                  >
                    🔔 Go to Billing
                  </button>
                )}

                {/* Occupied: hint to add items */}
                {table.status === 'occupied' && !isBillReq && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                    Click to add items
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1' }}>
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🪑</div>
                  <div className="empty-state-title">No tables in this section</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {qrModal    && <QRModal    table={qrModal}    onClose={() => setQrModal(null)} />}
      {statusModal && <StatusModal table={statusModal} onClose={() => setStatusModal(null)} onUpdated={fetchTables} />}
    </div>
  );
}
