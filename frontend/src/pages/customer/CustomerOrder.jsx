import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { tableApi, menuApi, orderApi } from '../../api';
import toast from 'react-hot-toast';
import { LogoIcon } from '../../components/Logo';

const FOOD_STATUS_CONFIG = {
  pending:    { icon: '⏳', label: 'Order Received',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  preparing:  { icon: '🔥', label: 'Cooking in Kitchen', color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  ready:      { icon: '✅', label: 'Ready to Serve!',    color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  served:     { icon: '🍽️', label: 'Served to Table',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  billed:     { icon: '🧾', label: 'Completed',          color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

function CustomerItemCard({ item, cart, onAdd, onRemove }) {
  const fullPrice = Number(item.price);
  const halfPrice = item.half_price ? Number(item.half_price) : Math.round(fullPrice * 0.6);
  const quarterPrice = item.quarter_price ? Number(item.quarter_price) : Math.round(fullPrice * 0.35);

  const portions = [
    { key: 'Full', label: `Full ₹${fullPrice}`, price: fullPrice },
    { key: 'Half', label: `Half ₹${halfPrice}`, price: halfPrice },
    { key: 'Quarter', label: `Quarter ₹${quarterPrice}`, price: quarterPrice },
  ];

  const [selectedPortion, setSelectedPortion] = useState('Full');
  const activePortion = portions.find(p => p.key === selectedPortion) || portions[0];

  const cartItemId = `${item.id}-${selectedPortion}`;
  const cartItem = cart.find(c => c.id === cartItemId);
  const qty = cartItem ? cartItem.qty : 0;

  const handleAdd = () => {
    onAdd({
      id: cartItemId,
      menu_item_id: item.id,
      name: `${item.name} (${selectedPortion})`,
      base_name: item.name,
      portion: selectedPortion,
      price: activePortion.price,
      is_veg: item.is_veg,
      image: item.image,
    });
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1.5px solid ${qty > 0 ? 'var(--primary)' : 'var(--surface-border)'}`,
      borderRadius: 'var(--radius-lg)', padding: 14,
      display: 'flex', gap: 12, alignItems: 'flex-start',
      transition: 'all 0.2s ease',
    }}>
      {item.image ? (
        <img src={item.image} style={{ width: 68, height: 68, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} alt={item.name} />
      ) : (
        <div style={{ width: 68, height: 68, borderRadius: 10, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
          {item.is_veg ? '🥗' : '🍗'}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          {item.is_veg ? <div className="veg-dot" /> : <div className="nonveg-dot" />}
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.name}</div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>
          ₹{activePortion.price}
        </div>

        {item.description && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.3 }}>
            {item.description}
          </div>
        )}

        {/* Portion Selector Pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {portions.map(p => {
            const isSel = selectedPortion === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPortion(p.key)}
                style={{
                  padding: '3px 8px', borderRadius: 12, fontSize: 11,
                  fontWeight: isSel ? 700 : 500,
                  border: isSel ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  background: isSel ? 'rgba(249,115,22,0.14)' : 'var(--bg-card2)',
                  color: isSel ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Add / Qty Control */}
        {qty > 0 ? (
          <div className="qty-control" style={{ width: '100%', justifyContent: 'space-between' }}>
            <button className="qty-btn" onClick={() => onRemove(cartItemId)}>−</button>
            <span className="qty-num" style={{ fontSize: 12 }}>{qty} in cart</span>
            <button className="qty-btn" onClick={handleAdd}>+</button>
          </div>
        ) : (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleAdd}
            style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }}
          >
            + Add ({selectedPortion})
          </button>
        )}
      </div>
    </div>
  );
}

export default function CustomerOrder() {
  const { qrToken } = useParams();
  const [table, setTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);

  const fetchActiveOrder = useCallback(async (tableId) => {
    if (!tableId) return;
    try {
      const res = await orderApi.getActiveTableOrder(tableId);
      setActiveOrder(res.data.order !== undefined ? res.data.order : res.data);
    } catch {}
  }, []);

  const init = useCallback(async () => {
    try {
      const tableRes = await tableApi.getByQR(qrToken);
      const tableData = tableRes.data;
      setTable(tableData);

      // Load Categories
      const catRes = await menuApi.getCategories();
      setCategories(catRes.data);
      if (catRes.data.length > 0) setSelectedCat(catRes.data[0].id);

      // Load active running order for this table
      await fetchActiveOrder(tableData.id);
    } catch {
      setError('This QR code is invalid or table not found.');
    } finally {
      setLoading(false);
    }
  }, [qrToken, fetchActiveOrder]);

  useEffect(() => {
    init();
  }, [init]);

  /* Poll active order every 5 seconds for live status updates */
  useEffect(() => {
    if (table?.id) {
      pollRef.current = setInterval(() => fetchActiveOrder(table.id), 5000);
      return () => clearInterval(pollRef.current);
    }
  }, [table, fetchActiveOrder]);

  /* Load items for selected category */
  useEffect(() => {
    if (selectedCat) {
      menuApi.getItems({ category: selectedCat, available: 'true' })
        .then(res => setItems(res.data))
        .catch(() => {});
    }
  }, [selectedCat]);

  const addToCart = (itemObj) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemObj.id);
      if (existing) {
        return prev.map(c => c.id === itemObj.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...itemObj, qty: 1 }];
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === cartItemId);
      if (existing?.qty > 1) {
        return prev.map(c => c.id === cartItemId ? { ...c, qty: c.qty - 1 } : c);
      }
      return prev.filter(c => c.id !== cartItemId);
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.error('Add items to cart first'); return; }
    setPlacing(true);
    try {
      if (activeOrder && activeOrder.id) {
        // Add items to existing running table order
        await orderApi.addItems(activeOrder.id, cart.map(i => ({
          menu_item: i.menu_item_id || i.id,
          quantity: i.qty,
          unit_price: i.price,
          portion: i.portion || 'Full',
        })));
        toast.success('🎉 Additional items added to your order!');
      } else {
        // Create new table order
        await orderApi.createOrder({
          table: table.id,
          order_type: 'dine_in',
          customer_name: customerName || 'Guest',
          items: cart.map(i => ({
            menu_item: i.menu_item_id || i.id,
            quantity: i.qty,
            unit_price: i.price,
            portion: i.portion || 'Full',
          })),
        });
        toast.success('🎉 Your order has been placed!');
      }
      setCart([]);
      fetchActiveOrder(table.id);
    } catch (e) {
      toast.error(e.response?.data?.detail || e.response?.data?.error || 'Failed to place order. Please ask staff.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading T Clock menu...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 60 }}>❌</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Invalid QR Code</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{error}</div>
    </div>
  );

  const orderStatusConfig = activeOrder ? (FOOD_STATUS_CONFIG[activeOrder.status] || FOOD_STATUS_CONFIG.pending) : null;
  const activeItems = activeOrder?.items || [];
  const readyItemsCount = activeItems.filter(i => i.status === 'ready' || i.status === 'served').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: cartCount > 0 ? 120 : 40 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
        padding: '20px 20px 36px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <LogoIcon size={44} />
            <div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, fontFamily: "'Playfair Display', serif" }}>T CLOCK RESTO CAFE</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>Time for Tea, Time for Taste 🌴</div>
            </div>
          </div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, marginTop: 4 }}>{table?.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Scan & Order — Real-time kitchen tracking</div>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: -16, position: 'relative', zIndex: 1 }}>

        {/* ── LIVE FOOD STATUS TRACKER CARD (When active order exists) ── */}
        {activeOrder && activeOrder.id && (
          <div style={{
            background: 'var(--bg-card)', border: `2px solid ${orderStatusConfig.color}`,
            borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Live Active Order #{activeOrder.id}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginTop: 2 }}>
                  {table?.name} Status
                </div>
              </div>
              <div style={{
                padding: '5px 12px', borderRadius: 99,
                background: orderStatusConfig.bg, color: orderStatusConfig.color,
                fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                border: `1px solid ${orderStatusConfig.color}44`,
              }}>
                <span>{orderStatusConfig.icon}</span>
                <span>{orderStatusConfig.label}</span>
              </div>
            </div>

            {/* Progress Bar */}
            {activeItems.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Food Cooking Progress</span>
                  <span>{readyItemsCount} of {activeItems.length} items ready</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-card2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, background: 'var(--success)',
                    width: `${(readyItemsCount / activeItems.length) * 100}%`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Ordered Item Status List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {activeItems.map((item, idx) => {
                const itemReady = item.status === 'ready' || item.status === 'served';
                const itemPrep  = item.status === 'preparing';
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: 'var(--radius)',
                    background: itemReady ? 'rgba(34,197,94,0.08)' : itemPrep ? 'rgba(249,115,22,0.08)' : 'var(--bg-card2)',
                    border: `1px solid ${itemReady ? 'rgba(34,197,94,0.25)' : itemPrep ? 'rgba(249,115,22,0.25)' : 'var(--surface-border)'}`,
                  }}>
                    <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{item.quantity}×</span>
                      <span style={{ fontWeight: 600 }}>{item.menu_item_name} {item.portion ? `(${item.portion})` : ''}</span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: itemReady ? '#22c55e22' : itemPrep ? '#f9731622' : '#f59e0b22',
                      color: itemReady ? '#22c55e' : itemPrep ? '#f97316' : '#f59e0b',
                    }}>
                      {itemReady ? '✅ Ready' : itemPrep ? '🔥 Cooking' : '⏳ Queued'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Auto-updating live from kitchen...</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--primary)' }}>Subtotal: ₹{activeOrder.subtotal}</span>
            </div>
          </div>
        )}

        {/* Customer Name Input (if new order) */}
        {!activeOrder && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)', padding: 14, marginBottom: 14 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Your Name (Optional)</label>
            <input
              className="form-input"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul"
              style={{ background: 'var(--bg-card2)' }}
            />
          </div>
        )}

        {/* Add More Items Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
            {activeOrder ? '➕ Add More Dishes to Table' : '📖 Restaurant Menu'}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs" style={{ marginBottom: 14 }}>
          {categories.map(cat => (
            <button key={cat.id} className={`cat-tab ${selectedCat === cat.id ? 'active' : ''}`} onClick={() => setSelectedCat(cat.id)}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(item => (
            <CustomerItemCard
              key={item.id}
              item={item}
              cart={cart}
              onAdd={addToCart}
              onRemove={removeFromCart}
            />
          ))}
        </div>
      </div>

      {/* Sticky Bottom Order Bar */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '14px 16px', background: 'var(--bg-sidebar)',
          borderTop: '1px solid var(--surface-border)',
          display: 'flex', gap: 12, alignItems: 'center',
          zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius)', padding: '8px 12px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cartCount} new item{cartCount > 1 ? 's' : ''}</div>
            <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--primary)' }}>₹{total.toFixed(0)}</div>
          </div>
          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center', padding: '12px 20px', flex: 1.5, fontSize: 15, fontWeight: 800 }}
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? <><div className="spinner spinner-sm" /> Processing...</> : activeOrder ? '➕ Add to Table Order' : '🍽️ Place Order'}
          </button>
        </div>
      )}
    </div>
  );
}
