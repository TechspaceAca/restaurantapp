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
    set({ user: null, token: null, cart: [], selectedTable: null, activeOrder: null, addItemsMode: false });
  },

  // ── Theme ────────────────────────────────────────────────────────
  theme: localStorage.getItem('theme') || 'dark',
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    set({ theme: nextTheme });
  },

  // ── Settings ─────────────────────────────────────────────────────
  restaurantSettings: null,
  setRestaurantSettings: (settings) => set({ restaurantSettings: settings }),

  // ── Cart ─────────────────────────────────────────────────────────
  cart: [],
  selectedTable: null,
  orderType: 'dine_in',

  // ── Active Order (for occupied tables — add-items mode) ──────────
  activeOrder: null,       // the existing order object when table is occupied
  addItemsMode: false,     // true = adding items to existing order; false = new order

  setSelectedTable: (table) => set({ selectedTable: table }),
  setOrderType: (type) => set({ orderType: type }),
  setActiveOrder: (order) => set({ activeOrder: order }),
  setAddItemsMode: (mode) => set({ addItemsMode: mode }),

  // Enter "add items" flow
  enterAddItemsMode: (table, order) => set({
    selectedTable: table,
    activeOrder: order,
    addItemsMode: true,
    cart: [],
  }),

  // Enter "new order" flow
  enterNewOrderMode: (table) => set({
    selectedTable: table,
    activeOrder: null,
    addItemsMode: false,
    cart: [],
  }),

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
