import { create } from 'zustand';

const useStore = create((set, get) => ({
  // ── Auth ────────────────────────────────────────────────────────
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('access_token') || null,

  login: (user, token, refreshToken) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, cart: [], selectedTable: null });
  },

  // ── Cart ─────────────────────────────────────────────────────────
  cart: [],
  selectedTable: null,
  orderType: 'dine_in',

  setSelectedTable: (table) => set({ selectedTable: table }),
  setOrderType: (type) => set({ orderType: type }),

  addToCart: (item) => {
    const cart = get().cart;
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      set({ cart: cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c) });
    } else {
      set({ cart: [...cart, { ...item, qty: 1, notes: '' }] });
    }
  },

  removeFromCart: (itemId) => {
    const cart = get().cart;
    const existing = cart.find(c => c.id === itemId);
    if (existing && existing.qty > 1) {
      set({ cart: cart.map(c => c.id === itemId ? { ...c, qty: c.qty - 1 } : c) });
    } else {
      set({ cart: cart.filter(c => c.id !== itemId) });
    }
  },

  updateCartItemNotes: (itemId, notes) => {
    set({ cart: get().cart.map(c => c.id === itemId ? { ...c, notes } : c) });
  },

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    return get().cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  },

  getCartCount: () => {
    return get().cart.reduce((sum, item) => sum + item.qty, 0);
  },
}));

export default useStore;
