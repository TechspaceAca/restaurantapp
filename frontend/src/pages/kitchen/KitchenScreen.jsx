import { useState, useEffect, useRef } from 'react';
import { kitchenApi, orderApi } from '../../api';
import useStore from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogoIcon } from '../../components/Logo';

function TimerBadge({ createdAt }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const urgent = mins >= 15;
  return (
    <span className={`kds-timer ${urgent ? 'urgent' : ''}`}>
      {mins}:{String(secs).padStart(2, '0')} {urgent ? '⚠️' : ''}
    </span>
  );
}

function KDSCard({ order, onItemUpdate, onOrderReady }) {
  const activeItems = order.items.filter(i => i.status !== 'cancelled');
  const allDone = activeItems.length > 0 && activeItems.every(i => i.status === 'ready');
  const hasCookingNotes = activeItems.some(i => i.notes && i.notes.trim().length > 0);

  return (
    <div className={`kds-card ${order.status}`} style={{ border: hasCookingNotes ? '2px solid #f59e0b' : undefined }}>
      <div className={`kds-card-header ${order.status}-bg`}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            {order.table_name ? `${order.table_name}` : '🥡 Takeaway'}
            {hasCookingNotes && (
              <span style={{ fontSize: 10, background: '#f59e0b', color: '#000', padding: '1px 6px', borderRadius: 99, fontWeight: 900, animation: 'pulse 2s infinite' }}>
                📝 SPECIAL NOTE
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Order #{order.id} · {order.order_type.replace('_', ' ')}
          </div>
        </div>
        <TimerBadge createdAt={order.created_at} />
      </div>

      <div>
        {activeItems.map(item => (
          <div
            key={item.id}
            className={`kds-item ${item.status === 'ready' ? 'done' : ''}`}
            onClick={() => onItemUpdate(item.id, item.status === 'ready' ? 'preparing' : 'ready')}
            style={{ cursor: 'pointer', padding: '12px 14px' }}
            title="Click to mark item as ready"
          >
            <span className="kds-item-qty">{item.quantity}</span>
            <div style={{ flex: 1 }}>
              <div className="kds-item-name" style={{ fontSize: 14, fontWeight: 800 }}>
                {item.menu_item_name}
                {item.portion && (
                  <span style={{ marginLeft: 6, fontSize: 11, background: 'rgba(249,115,22,0.18)', color: 'var(--primary)', padding: '1px 7px', borderRadius: 10, fontWeight: 800 }}>
                    {item.portion}
                  </span>
                )}
              </div>

              {/* Cooking Request / Special Notes Highlight Box */}
              {item.notes && item.notes.trim() && (
                <div style={{
                  marginTop: 6, padding: '6px 10px', borderRadius: 8,
                  background: 'rgba(245,158,11,0.16)', border: '1px solid rgba(245,158,11,0.4)',
                  color: '#f59e0b', fontSize: 12, fontWeight: 800,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>🔥</span>
                  <span>COOKING REQUEST: {item.notes}</span>
                </div>
              )}
            </div>

            <div style={{ marginLeft: 8 }}>
              {item.status === 'ready'
                ? <span style={{ color: 'var(--success)', fontSize: 20 }}>✅</span>
                : <span style={{ color: 'var(--text-dim)', fontSize: 20 }}>⬜</span>
              }
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--surface-border)' }}>
        {allDone ? (
          <button
            className="btn btn-success w-full"
            style={{ justifyContent: 'center', padding: '10px' }}
            onClick={() => onOrderReady(order.id)}
          >
            🔔 Mark Order Ready
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary flex-1"
              style={{ justifyContent: 'center', fontSize: 12 }}
              onClick={() => onOrderReady(order.id)}
            >
              Skip → Ready
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              {order.items.filter(i => i.status === 'ready').length}/{order.items.filter(i => i.status !== 'cancelled').length} done
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KitchenScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastCount, setLastCount] = useState(0);
  const { logout } = useStore();
  const navigate = useNavigate();
  const pollRef = useRef(null);

  useEffect(() => {
    fetchQueue();
    // Poll every 5 seconds
    pollRef.current = setInterval(fetchQueue, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await kitchenApi.getQueue();
      const newOrders = res.data;
      // Notify if new orders arrived
      if (newOrders.length > lastCount && lastCount > 0) {
        toast('🔔 New order received!', { icon: '🍳', duration: 3000 });
      }
      setLastCount(newOrders.length);
      setOrders(newOrders);
    } catch {
      // Silently fail on poll errors
    } finally { setLoading(false); }
  };

  const handleItemUpdate = async (itemId, status) => {
    try {
      await kitchenApi.updateItem(itemId, status);
      fetchQueue();
    } catch { toast.error('Failed to update item'); }
  };

  const handleOrderReady = async (orderId) => {
    try {
      await kitchenApi.markReady(orderId);
      toast.success('🔔 Order marked as Ready!');
      fetchQueue();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Kitchen Header */}
      <header style={{
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--surface-border)',
        padding: '0 24px',
        height: 'var(--header-h)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <LogoIcon size={40} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>👨‍🍳 Kitchen Display System</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>T CLOCK RESTO CAFE · Auto-refreshes every 5s</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            padding: '5px 14px', borderRadius: 'var(--radius-full)',
            background: orders.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
            border: `1px solid ${orders.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.2)'}`,
            fontSize: 13, fontWeight: 700,
            color: orders.length > 0 ? 'var(--danger)' : 'var(--success)',
            animation: orders.length > 0 ? 'pulse 2s infinite' : 'none',
          }}>
            🔥 {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} in Queue
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchQueue}>↻</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}>⏻ Logout</button>
        </div>
      </header>

      <div style={{ padding: 24 }}>
        {loading ? (
          <div className="loading-screen" style={{ marginTop: 60 }}>
            <div className="spinner" />
            <p>Loading kitchen queue...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <div style={{ fontSize: 80, marginBottom: 20, opacity: 0.3 }}>👨‍🍳</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Kitchen is all clear!</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
              No pending orders. Waiting for new orders...
            </div>
            <div style={{
              marginTop: 20, padding: '10px 20px', borderRadius: 'var(--radius-full)',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              display: 'inline-block', color: 'var(--success)', fontSize: 13, fontWeight: 600,
              animation: 'pulse 2s infinite',
            }}>
              🟢 Watching for orders...
            </div>
          </div>
        ) : (
          <div className="kds-grid">
            {orders.map(order => (
              <KDSCard
                key={order.id}
                order={order}
                onItemUpdate={handleItemUpdate}
                onOrderReady={handleOrderReady}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
