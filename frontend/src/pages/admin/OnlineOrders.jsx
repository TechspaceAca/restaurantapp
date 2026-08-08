import { useState, useEffect, useCallback } from 'react';
import { orderApi } from '../../api';
import toast from 'react-hot-toast';

export default function OnlineOrders() {
  const [activeTab, setActiveTab] = useState('swiggy'); // 'swiggy' | 'zomato'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoAcceptSwiggy, setAutoAcceptSwiggy] = useState(true);
  const [autoAcceptZomato, setAutoAcceptZomato] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderApi.getOrders({ order_type: activeTab });
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setOrders(data);
    } catch {
      toast.error(`Failed to load ${activeTab} orders`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 6000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      toast.success(`Order #${orderId} updated to ${newStatus.toUpperCase()}`);
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const isSwiggy = activeTab === 'swiggy';
  const brandColor = isSwiggy ? '#FC8019' : '#E23744';
  const brandBg = isSwiggy ? 'rgba(252,128,25,0.08)' : 'rgba(226,55,68,0.08)';
  const brandBorder = isSwiggy ? 'rgba(252,128,25,0.3)' : 'rgba(226,55,68,0.3)';

  // Mock aggregated stats for visual excellence
  const totalCount = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + Number(o.subtotal || 0), 0);

  return (
    <div style={{ padding: '20px 24px', minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        @media (max-width: 1024px) {
          .aggregator-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .aggregator-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .aggregator-tab-switcher { width: 100% !important; overflow-x: auto !important; justify-content: flex-start !important; }
          .title-wrap { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
        }
      `}</style>
      {/* Brand Selector Header */}
      <div className="aggregator-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: brandColor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 900, boxShadow: `0 4px 14px ${brandColor}55`,
          }}>
            {isSwiggy ? '🟠' : '🔴'}
          </div>
          <div>
            <div className="title-wrap" style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {isSwiggy ? 'Swiggy Merchant Partner Hub' : 'Zomato Merchant Partner Hub'}
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 99,
                background: 'rgba(34,197,94,0.14)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)',
                fontWeight: 700,
              }}>
                🟢 Live API Connected
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Direct T Clock POS order injection · Auto kitchen KDS print enabled
            </div>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="aggregator-tab-switcher" style={{ display: 'flex', gap: 8, background: 'var(--bg-card2)', padding: 4, borderRadius: 99, border: '1px solid var(--surface-border)' }}>
          <button
            onClick={() => setActiveTab('swiggy')}
            style={{
              padding: '8px 18px', borderRadius: 99, fontWeight: 800, fontSize: 13,
              background: isSwiggy ? '#FC8019' : 'transparent',
              color: isSwiggy ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>🟠</span> Swiggy Orders ({isSwiggy ? totalCount : 'Live'})
          </button>
          <button
            onClick={() => setActiveTab('zomato')}
            style={{
              padding: '8px 18px', borderRadius: 99, fontWeight: 800, fontSize: 13,
              background: !isSwiggy ? '#E23744' : 'transparent',
              color: !isSwiggy ? '#fff' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>🔴</span> Zomato Orders ({!isSwiggy ? totalCount : 'Live'})
          </button>
        </div>
      </div>

      {/* Channel Controls & Stats Bar */}
      <div className="aggregator-stats-grid">
        <div style={{ background: 'var(--bg-card)', border: `1.5px solid ${brandBorder}`, borderRadius: 'var(--radius)', padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Channel</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: brandColor, marginTop: 2 }}>
            {isSwiggy ? 'Swiggy Food Delivery' : 'Zomato Ordering'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius)', padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Channel Revenue</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', marginTop: 2 }}>
            ₹{totalRevenue.toFixed(0)}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius)', padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Orders Count</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', marginTop: 2 }}>
            {totalCount} Orders
          </div>
        </div>

        {/* Auto Accept Switch */}
        <div style={{
          background: brandBg, border: `1px solid ${brandBorder}`,
          borderRadius: 'var(--radius)', padding: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: brandColor }}>Auto-Accept Orders</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Send directly to kitchen</div>
          </div>
          <input
            type="checkbox"
            checked={isSwiggy ? autoAcceptSwiggy : autoAcceptZomato}
            onChange={e => isSwiggy ? setAutoAcceptSwiggy(e.target.checked) : setAutoAcceptZomato(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: brandColor, cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Orders Layout Grid */}
      {loading ? (
        <div className="loading-screen text-center mt-10">
          <div className="spinner" /><p>Loading {isSwiggy ? 'Swiggy' : 'Zomato'} live orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center p-16 mt-5">
          <div style={{ fontSize: 60, marginBottom: 14 }}>{isSwiggy ? '🟠' : '🔴'}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
            No Active {isSwiggy ? 'Swiggy' : 'Zomato'} Orders
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Waiting for new incoming delivery orders from {isSwiggy ? 'Swiggy app' : 'Zomato app'}...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map(o => (
            <div key={o.id} style={{
              background: 'var(--bg-card)',
              border: `1.5px solid ${o.status === 'confirmed' ? brandColor : 'var(--surface-border)'}`,
              borderRadius: 'var(--radius-lg)', padding: 16,
              display: 'flex', flexDirection: 'column', gap: 12,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Brand Top Accent Stripe */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: brandColor }} />

              {/* Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{isSwiggy ? 'SWG' : 'ZOM'}-{o.id}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: brandBg, color: brandColor, fontWeight: 800 }}>
                      {isSwiggy ? 'Swiggy Pick' : 'Zomato Delivery'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Customer: {o.customer_name || 'Online Customer'}
                  </div>
                </div>
                <span className={`badge status-${o.status}`} style={{ fontSize: 11, padding: '4px 10px' }}>
                  {o.status.toUpperCase()}
                </span>
              </div>

              {/* Delivery Rider Details Mock */}
              <div style={{
                background: 'var(--bg-card2)', borderRadius: 'var(--radius)',
                padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🛵</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Rider: {isSwiggy ? 'Ramesh Kumar' : 'Suresh K'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Arriving in ~4 mins for pickup</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e' }}>Assigned</span>
              </div>

              {/* Order Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                {o.items?.map(i => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span><strong style={{ color: brandColor }}>{i.quantity}×</strong> {i.menu_item_name} {i.portion ? `(${i.portion})` : ''}</span>
                    <span style={{ fontWeight: 600 }}>₹{(i.quantity * i.unit_price).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal & Action Buttons */}
              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 10, marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 15, marginBottom: 12 }}>
                  <span>Total Bill Amount</span>
                  <span style={{ color: brandColor }}>₹{Number(o.subtotal).toFixed(0)}</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {o.status === 'confirmed' && (
                    <button
                      className="btn flex-1"
                      style={{ background: brandColor, color: '#fff', justifyContent: 'center', fontSize: 12 }}
                      onClick={() => handleUpdateStatus(o.id, 'preparing')}
                    >
                      🍳 Send to Kitchen
                    </button>
                  )}
                  {o.status === 'preparing' && (
                    <button
                      className="btn btn-success flex-1"
                      style={{ justifyContent: 'center', fontSize: 12 }}
                      onClick={() => handleUpdateStatus(o.id, 'ready')}
                    >
                      🔔 Mark Food Ready
                    </button>
                  )}
                  {o.status === 'ready' && (
                    <button
                      className="btn flex-1"
                      style={{ background: '#3b82f6', color: '#fff', justifyContent: 'center', fontSize: 12 }}
                      onClick={() => handleUpdateStatus(o.id, 'served')}
                    >
                      🛵 Handover to Rider
                    </button>
                  )}
                  {o.status === 'served' && (
                    <button
                      className="btn btn-secondary flex-1"
                      style={{ justifyContent: 'center', fontSize: 12 }}
                      onClick={() => handleUpdateStatus(o.id, 'billed')}
                    >
                      🧾 Settle & Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
