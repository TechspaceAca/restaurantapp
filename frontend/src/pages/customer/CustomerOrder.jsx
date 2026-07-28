import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { tableApi, menuApi, orderApi } from '../../api';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { LogoIcon } from '../../components/Logo';

const FOOD_STATUS_CONFIG = {
  pending:    { icon: '⏳', label: 'Order Received',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  preparing:  { icon: '🔥', label: 'Cooking in Kitchen', color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  ready:      { icon: '✅', label: 'Ready to Serve!',    color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
  served:     { icon: '🍽️', label: 'Served to Table',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  billed:     { icon: '🧾', label: 'Completed',          color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

const QUICK_COOKING_REQUESTS = [
  '🌶️ Not Spicy',
  '🌶️ Mild / Less Spicy',
  '🔥 Extra Spicy',
  '🍯 More Sweet',
  '🧅 No Onion / Garlic',
  '🧈 Extra Butter / Ghee',
];

/* ── Zomato/Swiggy Style Customisation Modal ───────────────── */
function CustomiseItemModal({ item, onClose, onConfirm, initialPortion = 'Full', initialQty = 1, initialNotes = '' }) {
  const fullPrice = Number(item.price);
  const halfPrice = item.half_price ? Number(item.half_price) : Math.round(fullPrice * 0.6);
  const quarterPrice = item.quarter_price ? Number(item.quarter_price) : Math.round(fullPrice * 0.35);

  const portions = [
    { key: 'Full', label: `${item.name} (Full)`, price: fullPrice },
    { key: 'Half', label: `${item.name} (Half)`, price: halfPrice },
    { key: 'Quarter', label: `${item.name} (Quarter)`, price: quarterPrice },
  ];

  const [selectedPortion, setSelectedPortion] = useState(initialPortion);
  const [qty, setQty] = useState(initialQty);
  const [notes, setNotes] = useState(initialNotes);

  const activePortion = portions.find(p => p.key === selectedPortion) || portions[0];
  const totalPrice = activePortion.price * qty;

  const handleQuickPill = (pillText) => {
    if (notes.includes(pillText)) {
      setNotes(prev => prev.replace(pillText, '').replace(/,\s*,/g, ',').trim());
    } else {
      setNotes(prev => prev ? `${prev}, ${pillText}` : pillText);
    }
  };

  const handleSubmit = () => {
    onConfirm({
      item,
      portion: selectedPortion,
      price: activePortion.price,
      qty,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div
        className="modal"
        style={{
          maxWidth: 440, width: '92%', borderRadius: '24px', padding: 0, overflow: 'hidden',
          background: 'var(--bg-card)', border: '1px solid var(--surface-border)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)', animation: 'slideUp 0.3s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Close Icon Header */}
        <div style={{ position: 'relative', padding: '16px 20px 12px', borderBottom: '1px solid var(--surface-border)', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 16, width: 32, height: 32,
              borderRadius: '50%', background: 'var(--bg-card2)', border: '1px solid var(--surface-border)',
              color: 'var(--text)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
            {item.image ? (
              <img src={item.image} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }} alt={item.name} />
            ) : (
              <div style={{ width: 50, height: 50, borderRadius: 10, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {item.is_veg ? '🥗' : '🍗'}
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: item.is_veg ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                {item.is_veg ? <div className="veg-dot" /> : <div className="nonveg-dot" />}
                {item.is_veg ? 'Veg' : 'Non-Veg'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>{item.name}</div>
            </div>
          </div>
        </div>

        {/* Modal Content Scroll Body */}
        <div style={{ padding: 20, maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Section 1: Size Option */}
          <div style={{
            background: 'var(--bg-card2)', border: '1px solid var(--surface-border)',
            borderRadius: 16, padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Size</div>
              <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, background: 'rgba(249,115,22,0.12)', padding: '2px 8px', borderRadius: 12 }}>
                Required · Select 1 option
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {portions.map(p => {
                const isSelected = selectedPortion === p.key;
                return (
                  <div
                    key={p.key}
                    onClick={() => setSelectedPortion(p.key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--surface-border)'}`,
                      background: isSelected ? 'rgba(249,115,22,0.1)' : 'var(--bg-card)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--text)' : 'var(--text-muted)' }}>
                      {p.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>₹{p.price}</span>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--text-dim)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--primary)' }} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Cooking Request Input */}
          <div style={{
            background: 'var(--bg-card2)', border: '1px solid var(--surface-border)',
            borderRadius: 16, padding: 16,
          }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
              Add a cooking request (optional)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.35, marginBottom: 12 }}>
              The restaurant will try its best to fulfill your requests (e.g. less spicy, more sweet).
            </div>

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <textarea
                className="form-input"
                rows={3}
                maxLength={100}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Don't make it too spicy, extra sweet..."
                style={{ width: '100%', fontSize: 12.5, borderRadius: 12, padding: '10px 12px', background: 'var(--bg-card)', resize: 'none' }}
              />
              <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 10, color: 'var(--text-dim)' }}>
                {notes.length}/100
              </div>
            </div>

            {/* Quick Cooking Suggestion Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUICK_COOKING_REQUESTS.map(pill => {
                const isSelected = notes.includes(pill);
                return (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => handleQuickPill(pill)}
                    style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--surface-border)'}`,
                      background: isSelected ? 'rgba(249,115,22,0.18)' : 'var(--bg-card)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                  >
                    {pill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Action Bar */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--surface-border)',
          display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-card)',
        }}>
          {/* Quantity Counter */}
          <div className="qty-control" style={{ background: 'var(--bg-card2)', padding: '4px 8px', borderRadius: 12, border: '1px solid var(--surface-border)' }}>
            <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <span className="qty-num" style={{ width: 24, textAlign: 'center', fontWeight: 800 }}>{qty}</span>
            <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
          </div>

          {/* Add Item Button */}
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            style={{
              flex: 1, justifyContent: 'center', padding: '13px 20px',
              borderRadius: 14, fontSize: 15, fontWeight: 900,
              background: 'linear-gradient(135deg, #e11d48, #be123c)', borderColor: '#be123c',
              boxShadow: '0 4px 16px rgba(225,29,72,0.3)',
            }}
          >
            Add item ₹{totalPrice}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Zomato / Swiggy Style Menu Item Card ──────────────────── */
function CustomerItemCard({ item, cart, onOpenCustomise }) {
  const fullPrice = Number(item.price);
  
  // Total quantity across all portions of this menu item in cart
  const cartItems = cart.filter(c => c.menu_item_id === item.id);
  const totalQty = cartItems.reduce((s, c) => s + c.qty, 0);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1.5px solid ${totalQty > 0 ? 'var(--primary)' : 'var(--surface-border)'}`,
      borderRadius: 'var(--radius-lg)', padding: '16px 14px',
      display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center',
      transition: 'all 0.2s ease', position: 'relative',
    }}>
      {/* Right Dish Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {item.is_veg ? <div className="veg-dot" /> : <div className="nonveg-dot" />}
          {item.is_featured && (
            <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: 99, fontWeight: 700 }}>
              🔥 Highly reordered
            </span>
          )}
        </div>

        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{item.name}</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>₹{fullPrice}</div>

        {item.description && (
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.35 }}>
            {item.description}
          </div>
        )}
      </div>

      {/* Left Image & Overlay ADD+ Button */}
      <div style={{ position: 'relative', flexShrink: 0, width: 106, textAlign: 'center' }}>
        {item.image ? (
          <img src={item.image} style={{ width: 106, height: 96, borderRadius: 14, objectFit: 'cover' }} alt={item.name} />
        ) : (
          <div style={{ width: 106, height: 96, borderRadius: 14, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            {item.is_veg ? '🥗' : '🍗'}
          </div>
        )}

        {/* Overlay ADD + / Qty Button */}
        <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', width: '85%' }}>
          {totalQty > 0 ? (
            <div
              onClick={() => onOpenCustomise(item)}
              style={{
                background: '#be123c', color: '#fff', padding: '5px 10px', borderRadius: 10,
                fontWeight: 900, fontSize: 13, border: '2px solid #fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>-</span>
              <span>{totalQty}</span>
              <span>+</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenCustomise(item)}
              style={{
                width: '100%', background: '#fff', color: '#be123c', padding: '5px 12px', borderRadius: 10,
                fontWeight: 900, fontSize: 13, border: '1.5px solid #be123c',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ADD +
            </button>
          )}
        </div>

        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 14, fontWeight: 600 }}>
          customisable
        </div>
      </div>
    </div>
  );
}

export default function CustomerOrder() {
  const { qrToken } = useParams();
  const { theme, toggleTheme } = useStore();
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

  // Customise modal state
  const [customiseItem, setCustomiseItem] = useState(null);

  const pollRef = useRef(null);

  const fetchActiveOrder = useCallback(async (tableId) => {
    if (!tableId) return;
    try {
      const res = await orderApi.getActiveTableOrder(tableId);
      const actOrd = res.data && res.data.id ? res.data : (res.data && res.data.order ? res.data.order : null);
      setActiveOrder(actOrd);
    } catch {}
  }, []);

  const init = useCallback(async () => {
    try {
      const tableRes = await tableApi.getByQR(qrToken);
      const tableData = tableRes.data;
      setTable(tableData);

      const catRes = await menuApi.getCategories();
      const catList = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.results || []);
      setCategories(catList);
      if (catList.length > 0) setSelectedCat(catList[0].id);

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

  useEffect(() => {
    if (table?.id) {
      pollRef.current = setInterval(() => fetchActiveOrder(table.id), 5000);
      return () => clearInterval(pollRef.current);
    }
  }, [table, fetchActiveOrder]);

  useEffect(() => {
    if (selectedCat) {
      menuApi.getItems({ category: selectedCat, available: 'true' })
        .then(res => {
          const itemList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
          setItems(itemList);
        })
        .catch(() => {});
    }
  }, [selectedCat]);

  const handleConfirmCustomisation = ({ item, portion, price, qty, notes }) => {
    const cartItemId = `${item.id}-${portion}-${notes}`;
    setCart(prev => {
      const existing = prev.find(c => c.id === cartItemId);
      if (existing) {
        return prev.map(c => c.id === cartItemId ? { ...c, qty: c.qty + qty, notes } : c);
      }
      return [...prev, {
        id: cartItemId,
        menu_item_id: item.id,
        name: `${item.name} (${portion})`,
        portion,
        price,
        qty,
        notes,
        is_veg: item.is_veg,
        image: item.image,
      }];
    });
    toast.success(`🥰 Added ${qty}x ${item.name} (${portion}) to your cart!`);
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.error('Add items to cart first'); return; }
    setPlacing(true);
    try {
      if (activeOrder && activeOrder.id) {
        await orderApi.addItems(activeOrder.id, cart.map(i => ({
          menu_item: i.menu_item_id,
          quantity: i.qty,
          unit_price: i.price,
          portion: i.portion || 'Full',
          notes: i.notes || '',
        })));
        toast.success('🎉 Additional items added to your order!');
      } else {
        await orderApi.createOrder({
          table: table.id,
          order_type: 'dine_in',
          customer_name: customerName || 'Guest',
          items: cart.map(i => ({
            menu_item: i.menu_item_id,
            quantity: i.qty,
            unit_price: i.price,
            portion: i.portion || 'Full',
            notes: i.notes || '',
          })),
        });
        toast.success('🎉 Your order has been placed!');
      }
      setCart([]);
      fetchActiveOrder(table.id);
    } catch (e) {
      toast.error(e.response?.data?.detail || e.response?.data?.error || 'Failed to place order.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: 'var(--text)' }}>
      <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>🍽️ T CLOCK RESTO CAFE</div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading digital menu catalog...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>❌</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>Invalid or Expired QR Code</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 360, lineHeight: 1.5 }}>{error}</div>
      <button
        onClick={() => window.location.reload()}
        className="btn btn-primary"
        style={{ marginTop: 12, padding: '10px 24px', borderRadius: 12 }}
      >
        🔄 Refresh Page
      </button>
    </div>
  );

  const orderStatusConfig = (activeOrder?.status && FOOD_STATUS_CONFIG[activeOrder.status]) ? FOOD_STATUS_CONFIG[activeOrder.status] : FOOD_STATUS_CONFIG.pending;
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LogoIcon size={44} />
              <div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, fontFamily: "'Playfair Display', serif" }}>T CLOCK RESTO CAFE</div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>Customer Self-Order · {table?.name || 'Scan QR'}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              style={{
                background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.45)',
                color: '#fff', padding: '6px 14px', borderRadius: 99,
                fontSize: 12, fontWeight: 800, cursor: 'pointer', backdropFilter: 'blur(6px)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)', transition: 'all 0.2s ease',
              }}
            >
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, marginTop: 4 }}>{table?.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Scan & Order — Customise & track food live!</div>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: -16, position: 'relative', zIndex: 1 }}>

        {/* Live Food Tracker */}
        {activeOrder && activeOrder.id && (
          <div style={{
            background: 'var(--bg-card)', border: `2px solid ${orderStatusConfig.color}`,
            borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Active Order #{activeOrder.id}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginTop: 2 }}>
                  {table?.name} Status
                </div>
              </div>
              <div style={{
                padding: '5px 12px', borderRadius: 99,
                background: orderStatusConfig.bg, color: orderStatusConfig.color,
                fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>{orderStatusConfig.icon}</span>
                <span>{orderStatusConfig.label}</span>
              </div>
            </div>

            {activeItems.length > 0 && (
              <div style={{ marginBottom: 12 }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                      <div>
                        <span style={{ fontWeight: 600 }}>{item.menu_item_name} {item.portion ? `(${item.portion})` : ''}</span>
                        {item.notes && <div style={{ fontSize: 10, color: 'var(--warning)' }}>📝 {item.notes}</div>}
                      </div>
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
          </div>
        )}

        {/* Menu Catalog Title */}
        <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 12 }}>
          Menu Catalog
        </div>

        {/* Category Tabs */}
        <div className="category-tabs" style={{ marginBottom: 16 }}>
          {categories.map(cat => (
            <button key={cat.id} className={`cat-tab ${selectedCat === cat.id ? 'active' : ''}`} onClick={() => setSelectedCat(cat.id)}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map(item => (
            <CustomerItemCard
              key={item.id}
              item={item}
              cart={cart}
              onOpenCustomise={setCustomiseItem}
            />
          ))}
        </div>
      </div>

      {/* Zomato/Swiggy Customization Modal */}
      {customiseItem && (
        <CustomiseItemModal
          item={customiseItem}
          onClose={() => setCustomiseItem(null)}
          onConfirm={handleConfirmCustomisation}
        />
      )}

      {/* Sticky Bottom Order & Checkout Bar */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '14px 16px', background: 'var(--bg-sidebar)',
          borderTop: '1px solid var(--surface-border)',
          display: 'flex', gap: 12, alignItems: 'center',
          zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
        }}>
          <button
            className="btn"
            style={{
              width: '100%', justifyContent: 'space-between', padding: '14px 20px',
              borderRadius: 16, fontSize: 15, fontWeight: 900, color: '#fff',
              background: 'linear-gradient(135deg, #e11d48, #be123c)', borderColor: '#be123c',
              boxShadow: '0 4px 18px rgba(225,29,72,0.4)',
            }}
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🛍️</span>
              <div style={{ textAlign: 'left' }}>
                <div>{cartCount} item{cartCount > 1 ? 's' : ''} added</div>
                <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>Total ₹{total.toFixed(0)}</div>
              </div>
            </div>
            <span>{placing ? 'Placing…' : 'Continue & Checkout →'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
