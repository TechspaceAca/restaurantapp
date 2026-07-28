import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi, orderApi, tableApi } from '../../api';
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

/* ── Single menu-item card with Portion Selection ───────────── */
function MenuItemCard({ item, cart, onAdd, onRemove }) {
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
    <div
      className="menu-item-card"
      style={{
        borderColor: qty > 0 ? 'var(--primary)' : undefined,
        display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'
      }}
    >
      {item.image ? (
        <img src={item.image} alt={item.name} className="menu-item-image" />
      ) : (
        <div className="menu-item-image-placeholder">{item.is_veg ? '🥗' : '🍗'}</div>
      )}
      <div className="menu-item-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {item.is_veg ? <div className="veg-dot" /> : <div className="nonveg-dot" />}
          {item.is_featured && (
            <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(249,115,22,0.15)', color: 'var(--primary)', borderRadius: 99, fontWeight: 700 }}>
              🔥 Highly reordered
            </span>
          )}
        </div>
        <div className="menu-item-name" style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', margin: '2px 0 4px' }}>₹{activePortion.price}</div>
        {item.description && <div className="menu-item-desc" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{item.description}</div>}

        {/* Portion Selector Pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10, marginTop: 'auto' }}>
          {portions.map(p => {
            const isSel = selectedPortion === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedPortion(p.key); }}
                style={{
                  padding: '3px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: isSel ? 700 : 500,
                  border: isSel ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  background: isSel ? 'rgba(249,115,22,0.14)' : 'var(--bg-card2)',
                  color: isSel ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        {qty > 0 ? (
          <div className="qty-control" onClick={e => e.stopPropagation()} style={{ width: '100%', justifyContent: 'space-between' }}>
            <button className="qty-btn" onClick={() => onRemove(cartItemId)}>−</button>
            <span className="qty-num" style={{ fontSize: 12 }}>{qty} in cart</span>
            <button className="qty-btn" onClick={handleAdd}>+</button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAdd}
            style={{
              width: '100%', justifyContent: 'center', borderColor: 'var(--primary)',
              color: 'var(--primary)', fontWeight: 700, background: 'rgba(249,115,22,0.06)',
            }}
          >
            + Add ({selectedPortion})
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Cart panel ──────────────────────────────────────────────── */
function CartPanel({ cart, total, selectedTable, activeOrder, addItemsMode, orderType, onPlaceOrder, placing, onUpdateExistingItem, customerPhone, setCustomerPhone, customerName, setCustomerName }) {
  const { removeFromCart, addToCart, clearCart, updateCartItemNotes } = useStore();
  const [expandNotes, setExpandNotes] = useState({});

  const toggleNotes = (id) => setExpandNotes(prev => ({ ...prev, [id]: !prev[id] }));

  const tax = total * 0.05;
  const grandTotal = total + tax;

  const existingSubtotal = addItemsMode && activeOrder ? Number(activeOrder.subtotal) : 0;

  if (cart.length === 0 && !(addItemsMode && activeOrder?.items?.length)) {
    return (
      <div className="pos-cart-panel">
        <div className="pos-cart-header">
          <span style={{ fontWeight: 800, fontSize: 15 }}>🛒 {addItemsMode ? 'Edit / Add Items' : 'Cart'}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {selectedTable ? selectedTable.name : 'No table selected'}
          </span>
        </div>

        {/* Show existing order items even if cart is empty */}
        {addItemsMode && activeOrder?.items?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active Order #{activeOrder.id} — Items
            </div>
            {activeOrder.items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
                  <div style={{ fontWeight: 600 }}>{item.menu_item_name} {item.portion ? `(${item.portion})` : ''}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{item.unit_price} each</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => onUpdateExistingItem(item.id, item.quantity - 1)}>−</button>
                    <span className="qty-num">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => onUpdateExistingItem(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <span style={{ fontWeight: 700, minWidth: 44, textAlign: 'right' }}>₹{(item.quantity * item.unit_price).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-title">
            {addItemsMode ? 'Select new items to add' : 'Cart is empty'}
          </div>
          <div className="empty-state-text">Click dishes from menu to add</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-cart-panel">
      <div className="pos-cart-header">
        <span style={{ fontWeight: 800, fontSize: 15 }}>
          {addItemsMode ? '✏️ Edit / Add Items' : '🛒 Order'}
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
        {/* Existing order items (editable) */}
        {addItemsMode && activeOrder?.items?.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0 6px' }}>
              Current Order #{activeOrder.id} Items
            </div>
            {activeOrder.items.map(item => (
              <div key={`existing-${item.id}`} className="cart-item" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '8px' }}>
                <div style={{ flex: 1, fontSize: 13 }}>
                  <div className="cart-item-name">{item.menu_item_name} {item.portion ? `(${item.portion})` : ''}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{item.unit_price} each</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => onUpdateExistingItem(item.id, item.quantity - 1)} title="Decrease/Remove">−</button>
                    <span className="qty-num">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => onUpdateExistingItem(item.id, item.quantity + 1)} title="Increase">+</button>
                  </div>
                  <div className="cart-item-price">₹{(item.quantity * item.unit_price).toFixed(0)}</div>
                </div>
              </div>
            ))}
            {cart.length > 0 && (
              <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 0 6px', borderTop: '1px dashed var(--border)' }}>
                ➕ New Items to Add
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
          {/* Customer Mobile Number Section */}
          <div style={{ padding: '8px 10px', background: 'var(--bg-card2)', borderRadius: 8, marginBottom: 10, border: '1px solid var(--surface-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>📱</span> Customer Details (For WhatsApp Bill)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input
                className="form-input"
                style={{ fontSize: 11, padding: '6px 8px' }}
                type="tel"
                maxLength={10}
                placeholder="Mobile No"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
              <input
                className="form-input"
                style={{ fontSize: 11, padding: '6px 8px' }}
                type="text"
                placeholder="Name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
          </div>

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
  const [tables, setTables]         = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [placing, setPlacing]       = useState(false);

  const {
    cart, selectedTable, activeOrder, addItemsMode,
    orderType, setOrderType, setSelectedTable, setActiveOrder, setAddItemsMode,
    enterAddItemsMode, enterNewOrderMode,
    addToCart, removeFromCart, getCartTotal, clearCart,
  } = useStore();
  const navigate = useNavigate();

  /* Fetch categories, menu items, and dining tables */
  const fetchMenuAndTables = useCallback(async () => {
    try {
      const [catRes, itemRes, tableRes] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getItems({ available: 'true' }),
        tableApi.getTables(),
      ]);
      setCategories(catRes.data);
      setAllItems(itemRes.data);
      setTables(Array.isArray(tableRes.data) ? tableRes.data : tableRes.data.results || []);
      if (catRes.data.length > 0) {
        setSelectedCat(catRes.data[0].id);
      }
    } catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMenuAndTables(); }, [fetchMenuAndTables]);

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

  /* Auto-load active order whenever selectedTable changes or page loads */
  useEffect(() => {
    if (selectedTable?.id && orderType === 'dine_in') {
      orderApi.getActiveTableOrder(selectedTable.id)
        .then(res => {
          const actOrd = res.data && res.data.id ? res.data : (res.data && res.data.order ? res.data.order : null);
          if (actOrd && actOrd.id) {
            enterAddItemsMode(selectedTable, actOrd);
          } else {
            enterNewOrderMode(selectedTable);
          }
        })
        .catch(() => {});
    }
  }, [selectedTable?.id, orderType]);

  /* Select or switch table */
  const handleSelectTable = async (tableId) => {
    if (!tableId) {
      setSelectedTable(null);
      setActiveOrder(null);
      setAddItemsMode(false);
      return;
    }
    const tObj = tables.find(t => String(t.id) === String(tableId));
    if (!tObj) return;

    setSelectedTable(tObj);
    try {
      const res = await orderApi.getActiveTableOrder(tObj.id);
      const actOrd = res.data && res.data.id ? res.data : (res.data && res.data.order ? res.data.order : null);
      if (actOrd && actOrd.id) {
        enterAddItemsMode(tObj, actOrd);
        toast.success(`➕ Editing active Order #${actOrd.id} for ${tObj.name}`);
      } else {
        enterNewOrderMode(tObj);
        toast.success(`🪑 Selected ${tObj.name}`);
      }
    } catch {
      enterNewOrderMode(tObj);
    }
  };

  /* Update or remove an existing item on an active order */
  const handleUpdateExistingItem = async (itemId, newQty) => {
    try {
      if (newQty <= 0) {
        if (!confirm('Remove this item from the order?')) return;
        await orderApi.deleteOrderItem(itemId);
        toast.success('Item removed');
      } else {
        await orderApi.updateOrderItem(itemId, { quantity: newQty });
      }
      if (selectedTable?.id) {
        const res = await orderApi.getActiveTableOrder(selectedTable.id);
        const refreshedOrder = res.data.order !== undefined ? res.data.order : res.data;
        useStore.getState().setActiveOrder(refreshedOrder);
      }
    } catch {
      toast.error('Failed to update item quantity');
    }
  };

  /* Place new order OR add to existing order */
  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.error('Add items to cart first'); return; }
    if (orderType === 'dine_in' && !selectedTable) {
      toast.error('Please select a Dining Table first'); return;
    }
    setPlacing(true);
    try {
      if (addItemsMode && activeOrder?.id) {
        // Add items to existing order
        await orderApi.addItems(activeOrder.id, cart.map(item => ({
          menu_item: item.menu_item_id || item.id,
          quantity: item.qty,
          unit_price: item.price,
          portion: item.portion || 'Full',
          notes: item.notes || '',
        })));
        toast.success('✅ Items added to order!');
      } else {
        // Create new order
        await orderApi.createOrder({
          table: selectedTable?.id || null,
          order_type: orderType || 'dine_in',
          customer_name: customerName || 'Guest',
          customer_phone: customerPhone || '',
          items: cart.map(item => ({
            menu_item: item.menu_item_id || item.id,
            quantity: item.qty,
            unit_price: item.price,
            portion: item.portion || 'Full',
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
                onClick={() => {
                  setOrderType(t.key);
                  if (t.key !== 'dine_in') {
                    setSelectedTable(null);
                    setActiveOrder(null);
                  }
                }}
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

        {/* Table Selector Dropdown (when orderType is dine_in) */}
        {orderType === 'dine_in' && (
          <div style={{
            background: 'var(--bg-card)', border: '1.5px solid var(--surface-border)',
            borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🪑</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                  {selectedTable ? selectedTable.name : 'Select Table'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {selectedTable
                    ? (activeOrder ? `Occupied · Active Order #${activeOrder.id}` : `Available (${selectedTable.capacity || 4} seats)`)
                    : 'Choose a dining table to attach items'
                  }
                </div>
              </div>
            </div>

            <select
              className="form-select"
              style={{
                width: 'auto', minWidth: 180, fontWeight: 700,
                color: selectedTable ? 'var(--primary)' : 'var(--text-muted)',
                borderColor: selectedTable ? 'var(--primary)' : 'var(--border)',
                background: 'var(--bg-card2)', cursor: 'pointer',
              }}
              value={selectedTable?.id || ''}
              onChange={e => handleSelectTable(e.target.value)}
            >
              <option value="">-- Select Table --</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name || `Table ${t.number}`} {t.status === 'occupied' ? '🔴 (Occupied)' : t.status === 'bill_requested' ? '💜 (Bill Requested)' : '🟢 (Free)'}
                </option>
              ))}
            </select>
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
                cart={cart}
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
        onUpdateExistingItem={handleUpdateExistingItem}
        placing={placing}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        customerName={customerName}
        setCustomerName={setCustomerName}
      />
    </div>
  );
}
