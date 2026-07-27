import { useState, useEffect } from 'react';
import { orderApi, billingApi } from '../../api';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'served'];
const STATUS_LABELS = {
  pending: '⏳ Pending', confirmed: '✅ Confirmed', preparing: '🔥 Preparing',
  ready: '🔔 Ready', served: '🍽️ Served', billed: '🧾 Billed', cancelled: '❌ Cancelled',
};

function BillModal({ order, onClose, onBilled }) {
  const [form, setForm] = useState({
    tax_percent: 5, discount_amount: 0, discount_reason: '', payment_method: 'cash', notes: '',
  });
  const [billing, setBilling] = useState(false);

  const subtotal = order.subtotal;
  const tax = (subtotal * form.tax_percent) / 100;
  const total = subtotal + tax - (Number(form.discount_amount) || 0);

  const handleBill = async () => {
    setBilling(true);
    try {
      await billingApi.generateBill({ order_id: order.id, ...form });
      toast.success('🧾 Bill generated successfully!');
      onBilled();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to generate bill');
    } finally { setBilling(false); }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
      <html><head><title>Bill — ${order.table_name || 'T Clock'}</title>
      <style>
        body { font-family: monospace; padding: 20px; font-size: 13px; }
        h2, h3 { text-align: center; margin: 0; }
        .line { display: flex; justify-content: space-between; padding: 3px 0; }
        .total { border-top: 2px solid #000; font-weight: bold; font-size: 15px; margin-top: 8px; padding-top: 8px; }
        .dashed { border-top: 1px dashed #999; margin: 8px 0; }
      </style></head><body>
      <h2>🌴 T Clock POS</h2>
      <h3>${order.table_name || 'Takeaway'}</h3>
      <p style="text-align:center; font-size:11px;">${new Date().toLocaleString()}</p>
      <div class="dashed"></div>
      ${order.items.map(i => `<div class="line"><span>${i.quantity}× ${i.menu_item_name}</span><span>₹${(i.quantity * i.unit_price).toFixed(0)}</span></div>`).join('')}
      <div class="dashed"></div>
      <div class="line"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
      <div class="line"><span>GST (${form.tax_percent}%)</span><span>₹${tax.toFixed(2)}</span></div>
      ${form.discount_amount > 0 ? `<div class="line"><span>Discount</span><span>-₹${Number(form.discount_amount).toFixed(2)}</span></div>` : ''}
      <div class="line total"><span>TOTAL</span><span>₹${total.toFixed(2)}</span></div>
      <div class="dashed"></div>
      <p style="text-align:center; font-size:11px;">Payment: ${form.payment_method.toUpperCase()}</p>
      <p style="text-align:center; font-size:12px; margin-top:12px;">Thank you! Visit again 😊</p>
      </body></html>
    `);
    win.print();
    win.close();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">🧾 Generate Bill — {order.table_name || 'Order #' + order.id}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Order Items Summary */}
        <div style={{ background: 'var(--bg-card2)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 16 }}>
          {order.items.map(item => (
            <div key={item.id} className="bill-row" style={{ border: 'none', padding: '4px 0' }}>
              <span style={{ fontSize: 13 }}>{item.quantity}× {item.menu_item_name}</span>
              <span style={{ fontWeight: 600 }}>₹{(item.quantity * item.unit_price).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Tax %</label>
            <input className="form-input" type="number" value={form.tax_percent} onChange={e => setForm(f => ({ ...f, tax_percent: +e.target.value }))} min={0} max={28} />
          </div>
          <div className="form-group">
            <label className="form-label">Discount (₹)</label>
            <input className="form-input" type="number" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: e.target.value }))} min={0} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-select" value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
              <option value="cash">💵 Cash</option>
              <option value="card">💳 Card</option>
              <option value="upi">📱 UPI / QR</option>
              <option value="split">🔀 Split</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Discount Reason</label>
            <input className="form-input" value={form.discount_reason} onChange={e => setForm(f => ({ ...f, discount_reason: e.target.value }))} placeholder="Staff, loyalty..." />
          </div>
        </div>

        {/* Bill Summary */}
        <div style={{ background: 'var(--bg-card2)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 16 }}>
          <div className="bill-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="bill-row"><span>GST ({form.tax_percent}%)</span><span>₹{tax.toFixed(2)}</span></div>
          {form.discount_amount > 0 && <div className="bill-row" style={{ color: 'var(--success)' }}><span>Discount</span><span>-₹{Number(form.discount_amount).toFixed(2)}</span></div>}
          <div className="bill-total-row"><span>Grand Total</span><span>₹{total.toFixed(2)}</span></div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handlePrint}>🖨️ Preview Print</button>
          <button className="btn btn-primary flex-1" onClick={handleBill} disabled={billing} style={{ justifyContent: 'center' }}>
            {billing ? <><div className="spinner spinner-sm" /> Generating...</> : '✅ Generate & Close Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billModal, setBillModal] = useState(null);
  const [tab, setTab] = useState('active');
  const { selectedTable } = useStore();

  useEffect(() => { fetchOrders(); }, [tab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = tab === 'active'
        ? { status: 'served' }
        : { status: 'billed' };
      const res = await orderApi.getOrders(params);
      setOrders(res.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await orderApi.updateStatus(orderId, status);
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Cannot update status');
    }
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">🧾 Billing</div>
          <div className="page-subtitle">Manage orders and generate bills</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders}>↻ Refresh</button>
      </div>

      {/* All active orders across all tables */}
      <div className="tabs mb-4" style={{ display: 'inline-flex' }}>
        {[
          { key: 'active', label: '🔥 Ready to Bill' },
          { key: 'all', label: '📋 All Orders' },
          { key: 'billed', label: '✅ Billed' },
        ].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /><p>Loading orders...</p></div>
      ) : orders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-title">No orders here</div>
            <div className="empty-state-text">Orders will appear when staff takes them</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {orders.map(order => (
            <div key={order.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>
                    {order.table_name || 'Takeaway'} — #{order.id}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(order.created_at).toLocaleTimeString()}
                    {order.customer_name && ` · ${order.customer_name}`}
                  </div>
                </div>
                <span className={`badge status-${order.status}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              {/* Items */}
              <div style={{ background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 12 }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
                    <span>{item.quantity}× {item.menu_item_name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>₹{(item.quantity * item.unit_price).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Subtotal</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>

              {order.status !== 'billed' && order.status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {order.status === 'served' && (
                    <button className="btn btn-primary flex-1" onClick={() => setBillModal(order)} style={{ justifyContent: 'center' }}>
                      🧾 Generate Bill
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button className="btn btn-success flex-1" onClick={() => handleStatusUpdate(order.id, 'served')}>
                      ✅ Mark Served
                    </button>
                  )}
                  {['pending', 'confirmed', 'preparing'].includes(order.status) && (
                    <button className="btn btn-secondary flex-1" disabled style={{ justifyContent: 'center', opacity: 0.5 }}>
                      ⏳ In Kitchen...
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {billModal && (
        <BillModal
          order={billModal}
          onClose={() => setBillModal(null)}
          onBilled={() => { setBillModal(null); fetchOrders(); }}
        />
      )}
    </div>
  );
}
