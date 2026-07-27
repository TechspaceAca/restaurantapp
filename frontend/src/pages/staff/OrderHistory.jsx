import { useState, useEffect } from 'react';
import { orderApi } from '../../api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  pending: '⏳ Pending', confirmed: '✅ Confirmed', preparing: '🔥 Preparing',
  ready: '🔔 Ready', served: '🍽️ Served', billed: '🧾 Billed', cancelled: '❌ Cancelled',
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getOrders();
      setOrders(res.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await orderApi.updateStatus(orderId, 'cancelled');
      toast.success('Order cancelled');
      fetchOrders();
    } catch (e) { toast.error(e.response?.data?.error || 'Cannot cancel'); }
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">📋 Order History</div>
          <div className="page-subtitle">{orders.length} total orders</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>Loading orders...</p></div>
      ) : orders.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No orders yet</div>
        </div></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
              {orders.map(order => (
                <>
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>#{order.id}</td>
                    <td style={{ fontWeight: 600 }}>{order.table_name || '—'}</td>
                    <td><span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{order.order_type.replace('_', ' ')}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{order.items.length} items</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(order.subtotal).toFixed(0)}</td>
                    <td><span className={`badge status-${order.status}`}>{STATUS_LABELS[order.status]}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      {!['billed', 'cancelled'].includes(order.status) && (
                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); handleCancel(order.id); }} style={{ color: 'var(--danger)', fontSize: 12 }}>
                          ❌
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr key={`${order.id}-detail`}>
                      <td colSpan={8} style={{ background: 'var(--bg-card2)', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {order.items.map(item => (
                            <span key={item.id} style={{
                              padding: '4px 10px', borderRadius: 'var(--radius-full)',
                              background: 'var(--bg-hover)', fontSize: 12,
                            }}>
                              {item.quantity}× {item.menu_item_name} — ₹{(item.quantity * item.unit_price).toFixed(0)}
                            </span>
                          ))}
                        </div>
                        {order.notes && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>📝 {order.notes}</div>}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
