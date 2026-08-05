import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi, orderApi, tableApi, kitchenApi, menuApi } from '../../api';
import toast from 'react-hot-toast';
import AdminBillModal from '../../components/AdminBillModal';
import { LayoutGrid, CheckSquare, Users, FileText, IndianRupee, TrendingUp } from 'lucide-react';
// ─── Modals (reused from TableSetup / MenuManager) ──────────────────────────

function TableModal({ table, onClose, onSave }) {
  const [form, setForm] = useState({
    number: table?.number || '', name: table?.name || '',
    capacity: table?.capacity || 4, section: table?.section || 'indoor',
    is_active: table?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!form.number || !form.name) { toast.error('Table number and name required'); return; }
    setSaving(true);
    try {
      if (table?.id) await tableApi.updateTable(table.id, form);
      else await tableApi.createTable(form);
      toast.success(`Table ${table?.id ? 'updated' : 'created'}!`);
      onSave();
    } catch (e) { toast.error(e.response?.data?.number?.[0] || 'Failed to save table'); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{table?.id ? 'Edit' : 'Add New'} Table</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Table Number *</label>
            <input className="form-input" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="T-01, T-02..." />
          </div>
          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Table 1, VIP Table..." />
          </div>
          <div className="form-group">
            <label className="form-label">Seats</label>
            <input className="form-input" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} min={1} max={50} />
          </div>
          <div className="form-group">
            <label className="form-label">Section</label>
            <select className="form-select" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}>
              {['indoor','outdoor','terrace','private'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Table'}</button>
        </div>
      </div>
    </div>
  );
}

function QRModal({ table, onClose }) {
  const qrUrl = `${window.location.origin}/#/order/${table.qr_token}`;
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">QR — {table.name}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <img src={qrImg} alt="QR" style={{ width: 200, height: 200, margin: '0 auto 16px', display: 'block', borderRadius: 12 }} />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: 16, padding: '8px', background: 'var(--bg-card2)', borderRadius: 8 }}>{qrUrl}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary flex-1" onClick={() => { navigator.clipboard.writeText(qrUrl); toast.success('URL copied!'); }}>📋 Copy</button>
          <button className="btn btn-primary flex-1" onClick={() => window.open(qrImg, '_blank')}>⬇️ Download</button>
        </div>
      </div>
    </div>
  );
}

function ItemModal({ item, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || '', description: item?.description || '',
    price: item?.price || '',
    half_price: item?.half_price || '',
    quarter_price: item?.quarter_price || '',
    category: item?.category || (categories[0]?.id || ''),
    is_veg: item?.is_veg ?? true, is_available: item?.is_available ?? true,
    is_featured: item?.is_featured ?? false, prep_time: item?.prep_time || 15,
    sort_order: item?.sort_order || 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) { toast.error('Name, price and category are required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
          fd.append(k, v);
        }
      });
      if (imageFile) fd.append('image', imageFile);
      if (item?.id) await menuApi.updateItem(item.id, fd);
      else await menuApi.createItem(fd);
      toast.success(`Menu item ${item?.id ? 'updated' : 'created'}!`);
      onSave();
    } catch (e) { toast.error(e.response?.data?.price?.[0] || 'Failed to save item'); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{item?.id ? 'Edit' : 'Add New'} Menu Dish</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Item Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Malabar Mutton Biryani" />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: +e.target.value }))}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Prep Time (min)</label>
            <input className="form-input" type="number" value={form.prep_time} onChange={e => setForm(f => ({ ...f, prep_time: +e.target.value }))} />
          </div>

          {/* Portion Pricing Grid */}
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Portion Pricing (₹)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label className="form-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Full Price *</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="e.g. 380"
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Half Price</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={form.half_price}
                  onChange={e => setForm(f => ({ ...f, half_price: e.target.value }))}
                  placeholder={form.price ? `Auto (~₹${Math.round(form.price * 0.6)})` : "e.g. 220"}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quarter Price</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={form.quarter_price}
                  onChange={e => setForm(f => ({ ...f, quarter_price: e.target.value }))}
                  placeholder={form.price ? `Auto (~₹${Math.round(form.price * 0.35)})` : "e.g. 130"}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description..." rows={2} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Item Image</label>
            <input className="form-input" type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '12px 0' }}>
          {[{ key: 'is_veg', label: '🌿 Vegetarian' }, { key: 'is_available', label: '✅ Available' }, { key: 'is_featured', label: '⭐ Featured' }].map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
              {label}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Dish'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: color, color: '#fff',
          width: '40px', height: '40px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{value}</div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
        </div>
      </div>
      {sub && <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function RevenueBar({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 110, padding: '0 4px' }}>
      {data.slice(-14).map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div title={`₹${d.revenue.toFixed(0)}`} style={{
            width: '100%', minHeight: 4,
            height: `${Math.max((d.revenue / max) * 100, 4)}%`,
            background: 'linear-gradient(to top, var(--primary), var(--primary-dark))',
            borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease',
            opacity: i === data.slice(-14).length - 1 ? 1 : 0.65, cursor: 'pointer',
          }} />
          <span style={{ fontSize: 9, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            {new Date(d.date).getDate()}
          </span>
        </div>
      ))}
    </div>
  );
}

const STATUS_COLOR = {
  placed:    { bg: '#f9731615', color: '#f97316', label: 'PLACED' },
  cooking:   { bg: '#d9770615', color: '#d97706', label: 'COOKING' },
  ready:     { bg: '#05966915', color: '#059669', label: 'READY' },
  served:    { bg: '#3b82f615', color: '#3b82f6', label: 'SERVED' },
  paid:      { bg: '#16a34a15', color: '#16a34a', label: 'PAID' },
  cancelled: { bg: '#dc262615', color: '#dc2626', label: 'CANCELLED' },
};

const TABLE_STATUS_COLOR = {
  available:       { border: '#22c55e', bg: '#22c55e15', badge: 'badge-success', label: 'AVAILABLE' },
  occupied:        { border: '#f97316', bg: '#f9731615', badge: 'badge-warning', label: 'OCCUPIED' },
  bill_requested:  { border: '#8b5cf6', bg: '#8b5cf615', badge: 'badge-info',    label: 'BILL-REQUESTED' },
  reserved:        { border: '#3b82f6', bg: '#3b82f615', badge: 'badge-info',    label: 'RESERVED' },
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  // Analytics
  const [stats,      setStats]      = useState(null);
  const [chart,      setChart]      = useState([]);
  const [topItems,   setTopItems]   = useState([]);
  const [orderTypes, setOrderTypes] = useState([]);
  // Operations
  const [liveOrders, setLiveOrders] = useState([]);
  const [tables,     setTables]     = useState([]);
  const [kitchen,    setKitchen]    = useState([]);
  // Menu
  const [menuItems,  setMenuItems]  = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAllTables, setShowAllTables] = useState(false);
  // Modals
  const [tableModal, setTableModal] = useState(null);
  const [qrModal,    setQrModal]    = useState(null);
  const [itemModal,  setItemModal]  = useState(null);
  const [billModal,  setBillModal]  = useState(null);
  // UI
  const [loading, setLoading] = useState(true);
  const [kitchenActing, setKitchenActing] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      const [s, c, t, ot, lo, tb, kq, mi, cat] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getRevenueChart('daily'),
        analyticsApi.getTopItems(),
        analyticsApi.getOrderTypes(),
        orderApi.getOrders({ status: 'placed,cooking,ready,served' }),
        tableApi.getTables(),
        kitchenApi.getQueue(),
        menuApi.getItems(),
        menuApi.getCategories(),
      ]);
      setStats(s.data);
      setChart(c.data);
      setTopItems(t.data);
      setOrderTypes(ot.data);
      setLiveOrders(Array.isArray(lo.data) ? lo.data : lo.data?.results || []);
      setTables(Array.isArray(tb.data) ? tb.data : tb.data?.results || []);
      setKitchen(Array.isArray(kq.data) ? kq.data : kq.data?.results || []);
      setMenuItems(Array.isArray(mi.data) ? mi.data : mi.data?.results || []);
      setCategories(Array.isArray(cat.data) ? cat.data : cat.data?.results || []);
    } catch { toast.error('Failed to load dashboard data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleKitchenAction = async (orderId, action) => {
    setKitchenActing(a => ({ ...a, [orderId]: true }));
    try {
      if (action === 'preparing') {
        await kitchenApi.markPreparing(orderId);
        toast.success('Started Preparing!');
      } else {
        await kitchenApi.markReady(orderId);
        toast.success('Marked as Ready!');
      }
      fetchAll();
    } catch {
      toast.error('Failed to update');
    } finally {
      setKitchenActing(a => ({ ...a, [orderId]: false }));
    }
  };

  const handleDeleteTable = async (id) => {
    if (!confirm('Delete this table?')) return;
    try { await tableApi.deleteTable(id); toast.success('Table deleted'); fetchAll(); }
    catch { toast.error('Failed to delete table'); }
  };

  const handleToggleItem = async (itemId) => {
    try { await menuApi.toggleItem(itemId); fetchAll(); }
    catch { toast.error('Failed to toggle'); }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Delete this menu item?')) return;
    try { await menuApi.deleteItem(itemId); toast.success('Item deleted'); fetchAll(); }
    catch { toast.error('Failed to delete item'); }
  };

  const totalTables = tables.length;
  const availableTables = tables.filter(t => t.status === 'available').length;
  const billingTables = tables.filter(t => t.status === 'billing').length;
  const occupiedTables = totalTables - availableTables - billingTables;
  const totalRevenue  = stats?.total_revenue || 0;
  const todayRevenue  = stats?.today_revenue || 0;
  const statusPriority = { occupied: 1, billing: 2, cleaning: 3, available: 4 };
  const sortedTables = [...tables].sort((a, b) => {
    const pA = statusPriority[a.status] || 5;
    const pB = statusPriority[b.status] || 5;
    if (pA !== pB) return pA - pB;
    return a.number.localeCompare(b.number, undefined, { numeric: true });
  });
  const displayTables = showAllTables ? sortedTables : sortedTables.slice(0, 5);

  // Revenue by channel
  const channelRevenue = (() => {
    const map = {};
    orderTypes.forEach(ot => { map[ot.order_type] = ot.revenue || 0; });
    return [
      { label: 'Dine-in Revenue', value: map['dine_in'] || 0 },
      { label: 'Swiggy Revenue',  value: map['swiggy']  || 0 },
      { label: 'Zomato Revenue',  value: map['zomato']  || 0 },
    ];
  })();

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading dashboard...</p>
    </div>
  );

  return (
    <div className="fade-in">
      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard icon={LayoutGrid} label="Total Tables" value={totalTables} color="#8b5cf6" sub="All tables in the restaurant" />
        <StatCard icon={CheckSquare} label="Available Tables" value={availableTables} color="#22c55e" sub="Ready for guests" />
        <StatCard icon={Users} label="Occupied Tables" value={occupiedTables} color="#ef4444" sub="Currently in use" />
        <StatCard icon={FileText} label="Billing Pending" value={billingTables} color="#f97316" sub="Waiting for payment" />
        <StatCard icon={IndianRupee} label="Today's Sales" value={`₹${todayRevenue?.toFixed(0) || 0}`} color="#3b82f6" sub="Total sales today" />
        <StatCard icon={TrendingUp} label="Today's Orders" value={stats?.today_orders || 0} color="#14b8a6" sub="Total orders today" />
      </div>

      {/* ── Table QR Grid ── */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Dining Table QR Codes &amp; Real-time Occupancy ({tables.length} Tables)</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {displayTables.map(table => {
            const sc = TABLE_STATUS_COLOR[table.status] || TABLE_STATUS_COLOR.available;
            return (
              <div key={table.id} style={{
                border: `2px solid ${sc.border}`, background: sc.bg,
                borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: sc.border }}>{table.number}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setTableModal(table)} style={{ padding: '2px 6px' }}>✏️</button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDeleteTable(table.id)} style={{ padding: '2px 6px', color: 'var(--danger)' }}>🗑️</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {table.capacity} Seats · {table.section?.charAt(0).toUpperCase() + table.section?.slice(1)}
                </div>
                <span className={`badge ${sc.badge}`} style={{ display: 'inline-flex', marginBottom: 10, fontSize: 10 }}>
                  {sc.label}
                </span>
                <br />
                {(table.status === 'served' || table.status === 'billing' || table.status === 'bill_requested') && (
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ width: '100%', fontSize: 12, padding: '6px', marginBottom: '6px' }} 
                    onClick={() => setBillModal(table)}
                  >
                    🧾 Bill
                  </button>
                )}
                <button className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: 12, padding: '6px' }} onClick={() => setQrModal(table)}>
                  📱 Real QR Sticker
                </button>
              </div>
            );
          })}
        </div>
        {tables.length > 5 && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 14, width: '100%' }}
            onClick={() => navigate('/admin/tables')}
          >
            ▼ Show More Tables ({tables.length - 5} More)
          </button>
        )}
      </div>

      {/* ── Kitchen Order Screen ── */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Order Queue</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dedicated cooking queue for kitchen chefs</div>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
            <span style={{ padding: '3px 10px', borderRadius: 99, background: '#f97316', color: '#fff', fontWeight: 700 }}>
              ACCEPTED: {kitchen.filter(k => k.status === 'pending' || k.status === 'confirmed').length}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: 99, background: '#d97706', color: '#fff', fontWeight: 700 }}>
              PREPARING: {kitchen.filter(k => k.status === 'preparing').length}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: 99, background: '#059669', color: '#fff', fontWeight: 700 }}>
              READY: {kitchen.filter(k => k.status === 'ready').length}
            </span>
          </div>
        </div>
        {kitchen.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-state-icon">👨‍🍳</div>
            <div className="empty-state-text">No active kitchen orders</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {kitchen.map(order => {
              const typeLabel = order.order_type === 'dine_in' ? 'Staff POS' : 'QR Self-Order';
              const typeBg    = order.order_type === 'dine_in' ? '#3b82f6' : '#8b5cf6';
              const isAccepted = order.status === 'pending' || order.status === 'confirmed';
              return (
                <div key={order.id} style={{ border: '1.5px solid var(--surface-border)', borderRadius: 12, padding: 16, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 13 }}>
                        Table {order.table_number || order.table || 'Takeaway'}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: typeBg + '22', color: typeBg }}>
                        {typeLabel}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Order #{order.id}</span>
                  </div>
                  <div style={{ flex: 1, marginBottom: 14, maxHeight: 110, overflowY: 'auto', paddingRight: 4 }}>
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 10, padding: '4px 0', borderBottom: '1px solid var(--surface-border)', fontSize: 13 }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', minWidth: 20 }}>{item.quantity}×</span>
                        <span style={{ fontWeight: 600 }}>{item.menu_item_name || item.item_name || item.name || 'Item'} ({item.portion || 'Full'})</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ width: '100%', padding: '8px', background: isAccepted ? '#d9770615' : '#05966915', color: isAccepted ? '#d97706' : '#059669', textAlign: 'center', borderRadius: 8, fontWeight: 700, fontSize: 13, marginTop: 'auto' }}>
                    {isAccepted ? 'Waiting to Prepare...' : 'Cooking in Kitchen...'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Live Orders + Revenue by Channel ── */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
        {/* Live Orders */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Live Orders Task Monitor</div>
            <button className="btn btn-ghost btn-sm" onClick={fetchAll}>↻ Refresh</button>
          </div>
          {liveOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No active orders right now</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {liveOrders.slice(0, 6).map(order => {
                const sc = STATUS_COLOR[order.status] || STATUS_COLOR.placed;
                const typeLabel = order.order_type === 'dine_in' ? 'Staff POS' : 'QR Self-Order';
                const typeBadgeColor = order.order_type === 'dine_in' ? '#3b82f6' : '#8b5cf6';
                return (
                  <div key={order.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    border: `1.5px solid ${sc.color}22`, background: sc.bg,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>
                          Order #{order.id} — Table {order.table_number || order.table_name || order.table}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {order.items?.length || 0} items · ₹{order.total_amount || 0}
                        </div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: typeBadgeColor + '22', color: typeBadgeColor }}>
                        {typeLabel}
                      </span>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: sc.color + '22', color: sc.color, letterSpacing: '0.05em' }}>
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue by Channel */}
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Revenue by Channel</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {channelRevenue.map(ch => (
              <div key={ch.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>{ch.label}</span>
                <span style={{ fontWeight: 800, color: 'var(--text)' }}>₹{ch.value?.toFixed(1) || 0}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Order Type Split</div>
            {orderTypes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orderTypes.map(ot => {
                  const total = orderTypes.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? ((ot.count / total) * 100).toFixed(1) : 0;
                  const colors = { dine_in: '#f97316', takeaway: '#22c55e', delivery: '#3b82f6', swiggy: '#f59e0b', zomato: '#ef4444' };
                  return (
                    <div key={ot.order_type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{ot.order_type.replace('_', ' ')}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{ot.count} orders ({pct}%)</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--bg-card2)', borderRadius: 99 }}>
                        <div style={{ height: '100%', borderRadius: 99, background: colors[ot.order_type] || 'var(--primary)', width: `${pct}%`, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '12px 0' }}>
                <div className="empty-state-text">No orders yet</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ── Revenue Chart + Top Items ── */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Revenue Trend</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 14 days</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>₹{stats?.week_revenue?.toFixed(0) || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>This week</div>
            </div>
          </div>
          {chart.length > 0 ? <RevenueBar data={chart} /> : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">No revenue data yet</div>
            </div>
          )}
        </div>
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>🏆 Top Selling Items</div>
          {topItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topItems.slice(0, 5).map((item, i) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.category}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 13 }}>{item.total_qty} sold</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{item.total_revenue?.toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🍽️</div>
              <div className="empty-state-text">No billed orders yet</div>
            </div>
          )}
        </div>
      </div>



      {/* ── Modals ── */}
      {tableModal !== null && (
        <TableModal
          table={tableModal === 'new' ? null : tableModal}
          onClose={() => setTableModal(null)}
          onSave={() => { setTableModal(null); fetchAll(); }}
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
