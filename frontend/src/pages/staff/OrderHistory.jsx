import { useState, useEffect, useCallback } from 'react';
import useStore from '../../store/useStore';
import { orderApi } from '../../api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  pending:   '⏳ Pending',
  confirmed: '✅ Confirmed',
  preparing: '🔥 Preparing',
  ready:     '🔔 Ready',
  served:    '🍽️ Served',
  billed:    '🧾 Billed',
  cancelled: '❌ Cancelled',
};

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'billed', 'cancelled'];

const DATE_FILTERS = [
  { key: 'today',  label: '📅 Today'     },
  { key: 'week',   label: '📆 This Week' },
  { key: 'all',    label: '🗂️ All Time'  },
];

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isThisWeek(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return d >= weekAgo;
}

export default function OrderHistory() {
  const { user } = useStore();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter]     = useState('today');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getOrders();
      setOrders(res.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await orderApi.updateStatus(orderId, 'cancelled');
      toast.success('Order cancelled');
      fetchOrders();
    } catch (e) { toast.error(e.response?.data?.error || 'Cannot cancel'); }
  };

  /* ── Filter pipeline ── */
  const filtered = orders.filter(o => {
    // Staff filter (if not admin, only show own orders)
    if (user?.role !== 'admin' && o.created_by !== user?.id) return false;

    // Date filter
    if (dateFilter === 'today'  && !isToday(o.created_at))    return false;
    if (dateFilter === 'week'   && !isThisWeek(o.created_at)) return false;
    // Status filter
    if (statusFilter !== 'all' && o.status !== statusFilter)  return false;
    // Search
    if (search) {
      const q = search.toLowerCase();
      const inId    = String(o.id).includes(q);
      const inTable = (o.table_name || '').toLowerCase().includes(q);
      const inItem  = o.items.some(i => i.menu_item_name.toLowerCase().includes(q));
      if (!inId && !inTable && !inItem) return false;
    }
    return true;
  });

  /* Revenue for filtered set (billed orders only) */
  const totalRevenue = filtered
    .filter(o => o.status === 'billed')
    .reduce((sum, o) => sum + Number(o.subtotal), 0);

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">📋 Order History</div>
          <div className="page-subtitle" style={{ display: 'flex', gap: 12 }}>
            <span>{filtered.length} orders shown</span>
            {totalRevenue > 0 && (
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                ₹{totalRevenue.toFixed(0)} revenue (billed)
              </span>
            )}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders} style={{ gap: 6 }}>
          <span style={{ position: 'relative', top: '-1px', fontSize: '14px' }}>&#x21bb;</span> Refresh
        </button>
      </div>

      {/* ── Filters bar ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {/* Search */}
        <div className="search-box" style={{ flex: '1 1 220px', minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order #, table, item…"
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
          )}
        </div>

        {/* Date filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {DATE_FILTERS.map(d => (
            <button
              key={d.key}
              className={`btn btn-sm ${dateFilter === d.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDateFilter(d.key)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 150, padding: '7px 12px' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>
              {s === 'all' ? '— All Statuses —' : STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>Loading orders…</p></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No orders match your filters</div>
            <div className="empty-state-text">Try adjusting the date or status filter</div>
          </div>
        </div>
      ) : (
        <div className="card mobile-table-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Table</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <>
                    <tr
                      key={order.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      <td data-label="Order #" style={{ fontWeight: 800, color: 'var(--primary)' }}>#{order.id}</td>
                      <td data-label="Table" style={{ fontWeight: 600 }}>{order.table_name || '—'}</td>
                      <td data-label="Type">
                        <span style={{ textTransform: 'capitalize' }}>
                          {order.order_type === 'dine_in' ? '🪑' : order.order_type === 'takeaway' ? '🥡' : '🛵'}{' '}
                          {order.order_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td data-label="Items" style={{ color: 'var(--text-muted)' }}>{order.items.length} items</td>
                      <td data-label="Total" style={{ fontWeight: 700 }}>₹{Number(order.subtotal).toFixed(0)}</td>
                      <td data-label="Status"><span className={`badge status-${order.status}`}>{STATUS_LABELS[order.status]}</span></td>
                      <td data-label="Time" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="item-actions-td" data-label="">
                        {!['billed', 'cancelled'].includes(order.status) && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={e => { e.stopPropagation(); handleCancel(order.id); }}
                            style={{ color: 'var(--danger)', fontSize: 12 }}
                          >
                            ❌ Cancel
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expanded === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={8} style={{ background: 'var(--bg-card2)', padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: order.notes ? 8 : 0 }}>
                            {order.items.map(item => (
                              <span
                                key={item.id}
                                style={{
                                  padding: '4px 10px', borderRadius: 'var(--radius-full)',
                                  background: 'var(--bg-hover)', fontSize: 12,
                                }}
                              >
                                {item.quantity}× {item.menu_item_name} — ₹{(item.quantity * item.unit_price).toFixed(0)}
                                {item.notes && <em style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({item.notes})</em>}
                              </span>
                            ))}
                          </div>
                          {order.notes && (
                            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                              📝 {order.notes}
                            </div>
                          )}
                          {/* Bill info if billed */}
                          {order.status === 'billed' && order.bill && (
                            <div style={{ marginTop: 8, fontSize: 12, display: 'flex', gap: 16, color: 'var(--text-muted)' }}>
                              <span>💵 {order.bill.payment_method}</span>
                              <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                                ₹{Number(order.bill.total).toFixed(2)} total paid
                              </span>
                              {order.bill.discount_amount > 0 && (
                                <span style={{ color: 'var(--warning)' }}>
                                  Discount: ₹{Number(order.bill.discount_amount).toFixed(2)}
                                  {order.bill.discount_reason ? ` (${order.bill.discount_reason})` : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
