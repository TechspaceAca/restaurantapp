import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi, orderApi, tableApi, kitchenApi, menuApi } from '../../api';
import toast from 'react-hot-toast';
import { getEnrichedTableStatus, ENRICHED_STATUS_INFO } from '../../utils/tableUtils';

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
            <textarea classN








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

function StatCard({ icon, label, value, color, sub }) {
  return (
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ 
      background: 'var(--bg-card)', 
      borderRadius: '16px', 
      padding: '14px', 
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      minWidth: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ 
          background: color, 
          width: 42, height: 42, 
          borderRadius: '12px', 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontSize: 18, color: '#fff',
          flexShrink: 0,
          boxShadow: `0 4px 12px ${color}40`
        }}>
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{value}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{label}</div>
        </div>
      </div>
      {sub && (
        <div style={{ 
          fontSize: 10, color: 'var(--text-dim)', 
          marginTop: 12, paddingTop: 10, 
          borderTop: '1px dashed var(--border)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontWeight: 600
        }}>
          {sub}
        </div>
      )}
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
  pending:   { bg: '#fff7e6', color: '#f97316', label: 'PENDING' },
  placed:    { bg: '#fff7e6', color: '#f97316', label: 'PLACED' },
  confirmed: { bg: '#fff7e6', color: '#f97316', label: 'CONFIRMED' },
  preparing: { bg: '#fef3c7', color: '#d97706', label: 'COOKING' },
  cooking:   { bg: '#fef3c7', color: '#d97706', label: 'COOKING' },
  ready:     { bg: '#ecfdf5', color: '#059669', label: 'READY' },
  served:    { bg: '#eff6ff', color: '#3b82f6', label: 'SERVED' },
  paid:      { bg: '#f0fdf4', color: '#16a34a', label: 'PAID' },
  billed:    { bg: '#f0fdf4', color: '#16a34a', label: 'BILLED' },
  cancelled: { bg: '#fef2f2', color: '#dc2626', label: 'CANCELLED' },
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
  // UI
  const [loading, setLoading] = useState(true);
  const [kitchenActing, setKitchenActing] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      const activeStatuses = ['pending', 'placed', 'confirmed', 'preparing', 'cooking', 'ready', 'served'];
      const statusPromises = activeStatuses.map(status => orderApi.getOrders({ status }));

      const [s, c, t, ot, tb, kq, mi, cat, ...ordersResponses] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getRevenueChart('daily'),
        analyticsApi.getTopItems(),
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

  const handleKitchenStart = async (orderId) => {
    setKitchenActing(a => ({ ...a, [orderId]: true }));
    try { await kitchenApi.markReady(orderId); toast.success('Marked as Ready!'); fetchAll(); }
    catch { toast.error('Failed to update'); }
    finally { setKitchenActing(a => ({ ...a, [orderId]: false })); }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading dashboard...</p>
      <div className="spinner" />
      <p>Loading dashboard...</p>
    </div>
  );

    try { await menuApi.deleteItem(itemId); toast.success('Item deleted'); fetchAll(); }
    catch { toast.error('Failed to delete item'); }
  };

  const activeTables  = tables.filter(t => t.status !== 'available').length;
  const availTables   = tables.filter(t => t.status === 'available').length;
  const billingTables = tables.filter(t => t.status === 'bill_requested').length;
  const totalRevenue  = stats?.total_revenue || 0;
  const todayRevenue  = stats?.today_revenue || 0;
  
  const displayTables = [...tables]
    .sort((a, b) => (a.status !== 'available' ? -1 : 1) - (b.status !== 'available' ? -1 : 1))
    .slice(0, 5);

  // Revenue by channel
  const channelRevenue = (() => {
    const map = {};
    orderTypes.forEach(ot => { map[ot.order_type] = ot.revenue || 0; });
    return [
      { label: 'Dine-in Revenue', value: map['dine_in'] || 0 },
    .slice(0, 5);

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

      <p>Loading dashboard...</p>
    </div>
  );

  return (
    <div className="fade-in">


      {/* ── KPI Row ── */}
      <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <StatCard icon="📅" label="Today's Revenue"       value={`₹${todayRevenue?.toFixed(1)}`}  color="#22c55e" sub={`${stats?.today_orders || 0} Orders Today`} />
        <StatCard icon="🪑" label="Occupied Tables"      value={`${activeTables}`}               color="#3b82f6" sub={`${tables.length} Total Tables`} />
        <StatCard icon="🍽️" label="Active Menu Items"    value={`${menuItems.length}`}           color="#8b5cf6" sub="Live on Menu" />
        <StatCard icon="🛒" label="Today's Orders"      value={`${stats?.today_orders || 0}`}   color="#f59e0b" sub="Total Orders Placed" />
        <StatCard icon="🟢" label="Available Tables"    value={`${availTables}`}                color="#10b981" sub="Ready to Seat" />
        <StatCard icon="🔔" label="Billing Pending"     value={`${billingTables}`}              color="#ec4899" sub="Bill Requested" />
      </div>

      {/* ── Table QR Grid ── */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Dining Table QR Codes & Real-time Occupa
          <button className="btn btn-secondary btn-sm" onClick={() => setTableModal('new')}>+ Add New Table</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {displayTables.map(table => {
            const enrichedStatus = getEnrichedTableStatus(table, liveOrders);
            const sc = ENRICHED_STATUS_INFO[enrichedStatus] || ENRICHED_STATUS_INFO.available;
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
             
          })}
        </div>
        {tables.length > 5 && (
          <button
                  {sc.label}
                </span>
                <br />
                <button className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: 12, padding: '6px' }} onClick={() => setQrModal(table)}>
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

      {/* ── Admin Menu Management ── */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Menu Catalog & Pricing Management ({menuItems.length} Dishes)</div>
          <button className="btn btn-primary btn-sm" onClick={() => setItemModal('new')}>+ Add Dish</button>
        </div>
        {menuItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🍽️</div>
            <div className="empty-state-text">No menu items yet. Add your first dish!</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                    <tr key={item.id}>
                      <td>
                   






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
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button onClick={() => handleToggleItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <span className={`badge ${item.is_available ? 'badge-success' : 'badge-muted'}`}>
                              {item.is_available ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setItemModal(item)} style={{ fontSize: 11 }}>📷 Upload Photo</button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setItemModal(item)}>✏️ Edit</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteItem(item.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Live Orders + Revenue by Channel ── */}
      <div className="grid-2" styl
















































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

      {/* ── Kitchen Order Screen ── */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Kitchen Order Screen</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dedicated cooking queue for kitchen chefs</div>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
            <span style={{ padding: '3px 10px', borderRadius: 99, background: '#f97316', color: '#fff', fontWeight: 700 }}>
              PLACED: {kitchen.filter(k => k.status === 'placed').length}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: 99, background: '#d97706', color: '#fff', fontWeight: 700 }}>
              COOKING: {kitchen.filter(k => k.status === 'cooking').length}
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
              return (
                <div key={order.id} style={{ border: '1.5px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--bg-card)' }}>
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
            <div style={{ display: 'flex', fle







                </div>
              );
            })}
          </div>
        )}
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

  );
}






















  }, [table]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: 400 }}>
        <h3>Bill Details - {table.name}</h3>
        {bill ? (
          <div>
            <p>Total: ₹{bill.total_amount}</p>
            <button onClick={() => billingApi.printBill(bill.id)}>Print Bill</button>
            <button onClick={onClose}>Close</button>
          </div>
        ) : <p>Loading...</p>}
      </div>
    </div>
  );
};

// ... inside AdminDashboard component

const [viewBillModal, setViewBillModal] = React.useState(null);

// ... inside the table rendering section where logic for "billing" state exists:
{table.status === 'billing' && (
  <button onClick={() => setViewBillModal(table)}>View Bill</button>
)}

// ... inside the Modals section
      {tableModal !== null && (
        <TableModal
          table={tableModal === 'new' ? null : tableModal}
          onClose={() => setTableModal(null)}
          onSave={() => { setTableModal(null); fetchAll(); }}
        />
      )}
      {qrModal && <QRModal table={qrModal} onClose={() => setQrModal(null)} />}
      {itemModal !== null && (
        <ItemModal
          item={itemModal === 'new' ? null : itemModal}
          categories={categories}
          onClose={() => setItemModal(null)}
          onSave={() => { setItemModal(null); fetchAll(); }}
        />
      )}
      {viewBillModal && <ViewBillModal table={viewBillModal} onClose={() => setViewBillModal(null)} />}
    </div>
  );
}

