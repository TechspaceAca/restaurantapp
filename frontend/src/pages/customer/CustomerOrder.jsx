import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { tableApi, menuApi, orderApi } from '../../api';
import toast from 'react-hot-toast';

export default function CustomerOrder() {
  const { qrToken } = useParams();
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    init();
  }, [qrToken]);

  useEffect(() => {
    if (selectedCat) fetchItems(selectedCat);
  }, [selectedCat]);

  const init = async () => {
    try {
      // Lookup table by QR token
      const tableRes = await tableApi.getByQR(qrToken);
      setTable(tableRes.data);

      // Load menu
      const catRes = await menuApi.getCategories();
      setCategories(catRes.data);
      if (catRes.data.length > 0) setSelectedCat(catRes.data[0].id);
    } catch {
      setError('This QR code is invalid or the table is not found.');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (catId) => {
    try {
      const res = await menuApi.getItems({ category: catId, available: 'true' });
      setItems(res.data);
    } catch {}
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing?.qty > 1) return prev.map(c => c.id === itemId ? { ...c, qty: c.qty - 1 } : c);
      return prev.filter(c => c.id !== itemId);
    });
  };

  const getQty = (itemId) => cart.find(c => c.id === itemId)?.qty || 0;
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.error('Add items to cart first'); return; }
    setPlacing(true);
    try {
      await orderApi.createOrder({
        table: table.id,
        order_type: 'dine_in',
        customer_name: customerName || 'Guest',
        items: cart.map(i => ({ menu_item: i.id, quantity: i.qty })),
      });
      setOrdered(true);
      toast.success('🎉 Your order has been placed!');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to place order. Please ask staff.');
    } finally { setPlacing(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading menu...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 60 }}>❌</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Invalid QR Code</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{error}</div>
    </div>
  );

  if (ordered) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 80 }}>🎉</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>Order Placed!</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 300 }}>
        Your order has been sent to the kitchen. Please wait, our staff will serve you shortly.
      </div>
      <div style={{
        padding: '12px 24px', borderRadius: 'var(--radius-full)',
        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
        color: 'var(--success)', fontWeight: 700, fontSize: 14,
      }}>
        🌴 {table?.name} · {cart.length} items · ₹{total.toFixed(0)}
      </div>
      <button className="btn btn-secondary" onClick={() => { setOrdered(false); setCart([]); }}>
        Order More Items
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
        padding: '20px 20px 40px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#fff' }}>TC</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>T Clock Restaurant</div>
          </div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>{table?.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Scan & Order — No waiting needed!</div>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: -16, position: 'relative', zIndex: 1 }}>
        {/* Name Input */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 14 }}>
          <input
            className="form-input"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Your name (optional)"
            style={{ background: 'var(--bg-card2)' }}
          />
        </div>

        {/* Category Tabs */}
        <div className="category-tabs" style={{ marginBottom: 14 }}>
          {categories.map(cat => (
            <button key={cat.id} className={`cat-tab ${selectedCat === cat.id ? 'active' : ''}`} onClick={() => setSelectedCat(cat.id)}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => {
            const qty = getQty(item.id);
            return (
              <div key={item.id} style={{
                background: 'var(--bg-card)', border: `1.5px solid ${qty > 0 ? 'var(--primary)' : 'var(--surface-border)'}`,
                borderRadius: 'var(--radius-lg)', padding: 14,
                display: 'flex', gap: 12, alignItems: 'center',
                transition: 'border-color 0.2s',
              }}>
                {item.image ? (
                  <img src={item.image} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} alt={item.name} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                    {item.is_veg ? '🥗' : '🍗'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {item.is_veg ? <div className="veg-dot" /> : <div className="nonveg-dot" />}
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                  </div>
                  {item.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{item.description}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>₹{item.price}</span>
                    {qty === 0 ? (
                      <button className="btn btn-primary btn-sm" onClick={() => addToCart(item)} style={{ padding: '5px 14px' }}>+ Add</button>
                    ) : (
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => removeFromCart(item.id)}>−</button>
                        <span className="qty-num">{qty}</span>
                        <button className="qty-btn" onClick={() => addToCart(item)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Cart Button */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '16px', background: 'var(--bg-sidebar)',
          borderTop: '1px solid var(--surface-border)',
          display: 'flex', gap: 12, alignItems: 'center',
          zIndex: 100,
        }}>
          <div style={{
            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius)', padding: '10px 14px',
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cartCount} items</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>₹{total.toFixed(0)}</div>
          </div>
          <button
            className="btn btn-primary"
            style={{ justifyContent: 'center', padding: '12px 24px', flex: 1.5, fontSize: 15 }}
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? <><div className="spinner spinner-sm" /> Placing...</> : '🍽️ Place Order'}
          </button>
        </div>
      )}
    </div>
  );
}
