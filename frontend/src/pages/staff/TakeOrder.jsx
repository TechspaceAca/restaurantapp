import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi, orderApi } from '../../api';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

function MenuItemCard({ item, qty, onAdd, onRemove }) {
  const inCart = qty > 0;
  return (
    <div
      className="menu-item-card"
      style={{ borderColor: inCart ? 'var(--primary)' : undefined }}
      onClick={() => onAdd(item)}
    >
      {item.image ? (
        <img src={item.image} alt={item.name} className="menu-item-image" />
      ) : (
        <div className="menu-item-image-placeholder">
          {item.is_veg ? '🥗' : '🍗'}
        </div>
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

function CartPanel({ cart, total, selectedTable, orderType, onPlaceOrder, placing }) {
  const { removeFromCart, addToCart, clearCart } = useStore();

  if (cart.length === 0) {
    return (
      <div className="pos-cart-panel">
        <div className="pos-cart-header">
          <span style={{ fontWeight: 800, fontSize: 15 }}>🛒 Cart</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {selectedTable ? selectedTable.name : 'No table selected'}
          </span>
        </div>
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-title">Cart is empty</div>
          <div className="empty-state-text">Click items from the menu to add them</div>
        </div>
      </div>
    );
  }

  const tax = total * 0.05;
  const grandTotal = total + tax;

  return (
    <div className="pos-cart-panel">
      <div className="pos-cart-header">
        <span style={{ fontWeight: 800, fontSize: 15 }}>🛒 Order</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {selectedTable?.name || orderType}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={clearCart} style={{ padding: '3px 8px', fontSize: 11 }}>
            Clear
          </button>
        </div>
      </div>

      <div className="pos-cart-items">
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              {item.is_veg ? <div className="veg-dot" /> : <div className="nonveg-dot" />}
              <div>
                <div className="cart-item-name">{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{item.price} each</div>
              </div>
            </div>
            <div className="qty-control">
              <button className="qty-btn" onClick={() => removeFromCart(item.id)}>−</button>
              <span className="qty-num">{item.qty}</span>
              <button className="qty-btn" onClick={() => addToCart(item)}>+</button>
            </div>
            <div className="cart-item-price">₹{(item.price * item.qty).toFixed(0)}</div>
          </div>
        ))}
      </div>

      <div className="pos-cart-footer">
        <div className="bill-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Subtotal</span>
          <span style={{ fontWeight: 600 }}>₹{total.toFixed(2)}</span>
        </div>
        <div className="bill-row" style={{ padding: '4px 0', borderBottom: 'none' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>GST (5%)</span>
          <span style={{ fontWeight: 600 }}>₹{tax.toFixed(2)}</span>
        </div>
        <div className="divider" style={{ margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Total</span>
          <span style={{ fontWeight: 900, fontSize: 20, color: 'var(--primary)' }}>₹{grandTotal.toFixed(2)}</span>
        </div>
        <button
          className="btn btn-primary w-full"
          style={{ justifyContent: 'center', padding: '13px' }}
          onClick={onPlaceOrder}
          disabled={placing}
        >
          {placing ? <><div className="spinner spinner-sm" /> Placing...</> : '🍽️ Place Order →'}
        </button>
      </div>
    </div>
  );
}

export default function TakeOrder() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const { cart, selectedTable, orderType, addToCart, removeFromCart, getCartTotal, clearCart } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    if (selectedCat) fetchItems(selectedCat);
  }, [selectedCat]);

  const fetchMenu = async () => {
    try {
      const res = await menuApi.getCategories();
      setCategories(res.data);
      if (res.data.length > 0) {
        setSelectedCat(res.data[0].id);
      }
    } catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  };

  const fetchItems = async (catId) => {
    try {
      const res = await menuApi.getItems({ category: catId, available: 'true' });
      setItems(res.data);
    } catch { toast.error('Failed to load items'); }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.error('Add items to cart first'); return; }
    setPlacing(true);
    try {
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
      clearCart();
      navigate('/pos/billing');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  const filteredItems = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  const getQty = (itemId) => {
    const c = cart.find(i => i.id === itemId);
    return c ? c.qty : 0;
  };

  return (
    <div className="pos-layout">
      {/* Menu Panel */}
      <div className="pos-menu-panel">
        {/* Search */}
        <div className="search-box" style={{ marginBottom: 14 }}>
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search menu items..." />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>}
        </div>

        {/* Category Tabs */}
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

        {/* Items Grid */}
        {loading ? (
          <div className="loading-screen"><div className="spinner" /><p>Loading menu...</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {filteredItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                qty={getQty(item.id)}
                onAdd={addToCart}
                onRemove={removeFromCart}
              />
            ))}
            {filteredItems.length === 0 && (
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

      {/* Cart Panel */}
      <CartPanel
        cart={cart}
        total={getCartTotal()}
        selectedTable={selectedTable}
        orderType={orderType}
        onPlaceOrder={handlePlaceOrder}
        placing={placing}
      />
    </div>
  );
}
