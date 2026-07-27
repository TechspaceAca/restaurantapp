import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi, orderApi } from '../../api';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

/* ── Order Type selector ─────────────────────────────────────── */
const ORDER_TYPES = [
  { key: 'dine_in',  label: 'Dine In',  icon: '🪑' },
  { key: 'takeaway', label: 'Takeaway', icon: '🥡' },
  { key: 'delivery', label: 'Delivery', icon: '🛵' },
  { key: 'swiggy',   label: 'Swiggy',   icon: '🟠' },
  { key: 'zomato',   label: 'Zomato',   icon: '🔴' },
];

/* ── Single menu-item card ───────────────────────────────────── */
function MenuItemCard({ item, qty, onAdd, onRemove }) {
  const inCart = qty > 0;
  return (
    <div
      className="menu-item-card"
      style={{ borderColor: inCart ? 'var(--primary)' : undefined, position: 'relative' }}
      onClick={() => onAdd(item)}
    >
      {item.image ? (
        <img src={item.image} alt={item.name} className="menu-item-image" />
      ) : (
        <div className="menu-item-image-placeholder">{item.is_veg ? '🥗' : '🍗'}</div>
      )}
      <div className="menu-item-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {item.is_veg ? <div className="veg-dot" /> : <div className="nonveg-dot" />}
          <div className="menu-item-name">{item.name}</div>
        </div>
        {item.description && <div className="menu-item-desc">{item.description}</div>}
        <div className="menu-item-footer">
          <div className="menu-item-price">₹{item.price}</div>
          {inCart ? (
            <div className="qty-control" onClick={e => e.stopPropagation()}>
              <button className="qty-btn" onClick={() => onRemove(item.id)}>−</button>
              <span className="qty-num">{qty}</span>
              <button className="qty-btn" onClick={() => onAdd(item)}>+</button>
            </div>
          ) : (
            <div className="menu-item-add">+</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Cart panel ──────────────────────────────────────────────── */
function CartPanel({ cart, total, selectedTable, activeOrder, addItemsMode, orderType, onPlaceOrder, placing }) {
  const { removeFromCart, addToCart, clearCart, updateCartItemNotes } = useStore();
  const [expandNotes, setExpandNotes] = useState({});

  const toggleNotes = (id) => setExpandNotes(prev => ({ ...prev, [id]: !prev[id] }));

  const tax = total * 0.05;
  const grandTotal = total + tax;

  const existingSubtotal = addItemsMode && activeOrder ? Number(activeOrder.subtotal) : 0;
  const newTotal = grandTotal + existingSubtotal * 1.05; // rough combined with tax

  if (cart.length === 0 && !(addItemsMode && activeOrder?.items?.length)) {
    return (
      <div className="pos-cart-panel">
        <div className="pos-cart-header">
          <span style={{ fontWeight: 800, fontSize: 15 }}>🛒 {addItemsMode ? 'Add Items' : 'Cart'}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {selectedTable ? selectedTable.name : 'No table selected'}
          </span>
        </div>

        {/* Show existing order items even if cart is empty */}
        {addItemsMode && activeOrder?.items?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Order #{activeOrder.id}
            </div>
            {activeOrder.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid var(--border)', opacity: 0.7 }}>
                <span>{item.quantity}× {item.menu_item_name}</span>
                <span style={{ color: 'var(--text-muted)' }}>₹{(item.quantity * item.unit_price).toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-title">
            {addItemsMode ? 'Select new items to add' : 'Cart is empty'}
          </div>
          <div className="empty-state-text">Click items from the menu</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-cart-panel">
      <div className="pos-cart-header">
        <span style={{ fontWeight: 800, fontSize: 15 }}>
          {addItemsMode ? '➕ Add Items' : '🛒 Order'}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {selectedTable?.name || orderType}
          </span>
          {cart.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearCart} style={{ padding: '3px 8px', fontSize: 11 }}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="pos-cart-items">
        {/* Existing order items (greyed out, not editable) */}
        {addItemsMode && activeOrder?.items?.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0 6px' }}>
              Existing — Order #{activeOrder.id}
            </div>
            {activeOrder.items.map(item => (
              <div key={`existing-${item.id}`} className="cart-item" style={{ opacity: 0.55 }}>
                <div style={{ flex: 1, fontSize: 13 }}>
                  <div className="cart-item-name">{item.menu_item_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{item.unit_price} each</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 6 }}>×{item.quantity}</span>
                <div className="cart-item-price">₹{(item.quantity * item.unit_price).toFixed(0)}</div>
              </div>
            ))}
            {cart.length > 0 && (
              <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 0 6px', borderTop: '1px dashed var(--border)' }}>
                ➕ New Items
              </div>
            )}
          </>
        )}

        {/* New cart items */}
        {cart.map(item => (
          <div key={item.id} style={{ marginBottom: 4 }}>
            <div className="cart-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                {item.is_veg ? <div className="veg-dot" /> : <div className="nonveg-dot" />}
                <div>
                  <div className="cart-item-name">{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{item.price} each</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => toggleNotes(item.id)}
                  title="Add note"
                  style={{
                    background: expandNotes[item.id] ? 'rgba(249,115,22,0.12)' : 'none',
                    border: 'none', cursor: 'pointer', fontSize: 13,
                    color: expandNotes[item.id] ? 'var(--primary)' : 'var(--text-muted)',
                    padding: '2px 4px', borderRadius: 4,
                  }}
                >📝</button>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => removeFromCart(item.id)}>−</button>
                  <span className="qty-num">{item.qty}</span>
                  <button className="qty-btn" onClick={() => addToCart(item)}>+</button>
                </div>
                <div className="cart-item-price">₹{(item.price * item.qty).toFixed(0)}</div>
              </div>
            </div>
            {expandNotes[item.id] && (
              <input
                className="form-input"
                style={{ fontSize: 12, padding: '5px 10px', marginTop: 4 }}
                placeholder="Special instructions…"
                value={item.notes || ''}
                onChange={e => updateCartItemNotes(item.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="pos-cart-footer">
          <div className="bill-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {addItemsMode ? 'New items subtotal' : 'Subtotal'}
            </span>
            <span style={{ fontWeight: 600 }}>₹{total.toFixed(2)}</span>
          </div>
          <div className="bill-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>GST (5%)</span>
            <span style={{ fontWeight: 600 }}>₹{tax.toFixed(2)}</span>
          </div>
          <div className="divider" style={{ margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>
              {addItemsMode ? 'Adding' : 'Total'}
            </span>
            <span style={{ fontWeight: 900, fontSize: 20, color: 'var(--primary)' }}>₹{grandTotal.toFixed(2)}</span>
          </div>
          <button
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', padding: '13px' }}
            onClick={onPlaceOrder}
            disabled={placing}
          >
            {placing
              ? <><div className="spinner spinner-sm" /> Processing...</>
              : addItemsMode ? '➕ Add to Order →' : '🍽️ Place Order →'
            }
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main TakeOrder component ────────────────────────────────── */
export default function TakeOrder() {
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems]     = useState([]);    // all menu items for global search
  const [items, setItems]           = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [placing, setPlacing]       = useState(false);

  const {
    cart, selectedTable, activeOrder, addItemsMode,
    orderType, setOrderType,
    addToCart, removeFromCart, getCartTotal, clearCart,
  } = useStore();
  const navigate = useNavigate();

  /* Fetch categories + all items for search */
  const fetchMenu = useCallback(async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getItems({ available: 'true' }),
      ]);
      setCategories(catRes.data);
      setAllItems(itemRes.data);
      if (catRes.data.length > 0) {
        setSelectedCat(catRes.data[0].id);
      }
    } catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  /* Load items for selected category */
  useEffect(() => {
    if (selectedCat) {
      menuApi.getItems({ category: selectedCat, available: 'true' })
        .then(res => setItems(res.data))
        .catch(() => toast.error('Failed to load items'));
    }
  }, [selectedCat]);

  /* Determine which items to show */
  const isSearching = search.trim().length > 0;
  const displayItems = isSearching
    ? allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const getQty = (itemId) => {
    const c = cart.find(i => i.id === itemId);
    return c ? c.qty : 0;
  };

  /* Place new order OR add to existing order */
  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.error('Add items to cart first'); return; }
    setPlacing(true);
    try {
      if (addItemsMode && activeOrder?.id) {
        // Add items to existing order
        await orderApi.addItems(activeOrder.id, cart.map(item => ({
          menu_item: item.id,
          quantity: item.qty,
          notes: item.notes || '',
        })));
        toast.success('✅ Items added to order!');
      } else {
        // Create new order
        await orderApi.createOrder({
          table: selectedTable?.id || null,
          order_type: orderType || 'dine_in',
          items: cart.map(item => ({
            menu_item: item.id,
            quantity: item.qty,
            notes: item.notes || '',
          })),
        });
        toast.success('🎉 Order placed successfully!');
      }
      clearCart();
      navigate('/pos/billing');
    } catch (e) {
      toast.error(e.response?.data?.detail || e.response?.data?.error || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  return (
    <div className="pos-layout">
      {/* ── Menu panel ── */}
      <div className="pos-menu-panel">

        {/* Order Type (only for new orders) */}
        {!addItemsMode && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {ORDER_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setOrderType(t.key)}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: 'var(--radius)',
                  border: orderType === t.key
                    ? '1.5px solid var(--primary)'
                    : '1.5px solid var(--border)',
                  background: orderType === t.key
                    ? 'rgba(249,115,22,0.10)'
                    : 'var(--bg-card)',
                  color: orderType === t.key ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: orderType === t.key ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 16 }}>{t.icon}</div>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Add-items mode banner */}
        {addItemsMode && activeOrder && (
          <div style={{
            background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 'var(--radius)', padding: '8px 14px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>➕</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                Adding to Order #{activeOrder.id}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {selectedTable?.name} · {activeOrder.items?.length || 0} existing items
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div className="search-box" style={{ flex: 1, marginBottom: 0 }}>
            <span className="search-icon">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search dishes or items by name..."
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>
                ×
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 18px', gap: 6 }}>
            🔍 Search
          </button>
        </form>

        {/* Category tabs (hidden when searching) */}
        {!isSearching && (
          <div className="category-tabs">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`cat-tab ${selectedCat === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCat(cat.id)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            🔍 Showing {displayItems.length} result{displayItems.length !== 1 ? 's' : ''} for "{search}"
          </div>
        )}

        {/* Items grid */}
        {loading ? (
          <div className="loading-screen"><div className="spinner" /><p>Loading menu...</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {displayItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                qty={getQty(item.id)}
                onAdd={addToCart}
                onRemove={removeFromCart}
              />
            ))}
            {displayItems.length === 0 && (
              <div style={{ gridColumn: '1/-1' }}>
                <div className="empty-state">
                  <div className="empty-state-icon">🍴</div>
                  <div className="empty-state-title">No items found</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cart panel ── */}
      <CartPanel
        cart={cart}
        total={getCartTotal()}
        selectedTable={selectedTable}
        activeOrder={activeOrder}
        addItemsMode={addItemsMode}
        orderType={orderType}
        onPlaceOrder={handlePlaceOrder}
        placing={placing}
      />
    </div>
  );
}
