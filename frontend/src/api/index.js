import api from './axios';

export const authApi = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  profile: () => api.get('/auth/profile/'),
  getStaff: () => api.get('/auth/staff/'),
  createStaff: (data) => api.post('/auth/register/', data),
  updateStaff: (id, data) => api.patch(`/auth/staff/${id}/`, data),
  deleteStaff: (id) => api.delete(`/auth/staff/${id}/`),
};

export const menuApi = {
  getCategories: () => api.get('/menu/categories/'),
  createCategory: (data) => api.post('/menu/categories/', data),
  updateCategory: (id, data) => api.patch(`/menu/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/menu/categories/${id}/`),

  getItems: (params) => api.get('/menu/items/', { params }),
  createItem: (data) => api.post('/menu/items/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateItem: (id, data) => api.patch(`/menu/items/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteItem: (id) => api.delete(`/menu/items/${id}/`),
  toggleItem: (id) => api.patch(`/menu/items/${id}/toggle/`),
};

export const tableApi = {
  getTables: (params) => api.get('/tables/', { params }),
  createTable: (data) => api.post('/tables/', data),
  updateTable: (id, data) => api.patch(`/tables/${id}/`, data),
  deleteTable: (id) => api.delete(`/tables/${id}/`),
  updateStatus: (id, status) => api.patch(`/tables/${id}/status/`, { status }),
  getByQR: (token) => api.get(`/tables/qr/${token}/`),
};

export const orderApi = {
  getOrders: (params) => api.get('/orders/', { params }),
  getOrder: (id) => api.get(`/orders/${id}/`),
  createOrder: (data) => api.post('/orders/', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status/`, { status }),
  addItems: (id, items) => api.post(`/orders/${id}/add-items/`, { items }),
  getActiveTableOrder: (tableId) => api.get(`/orders/table/${tableId}/active/`),
};

export const billingApi = {
  getBills: (params) => api.get('/billing/', { params }),
  getBill: (id) => api.get(`/billing/${id}/`),
  getOrderBill: (orderId) => api.get(`/billing/order/${orderId}/`),
  generateBill: (data) => api.post('/billing/generate/', data),
  getWhatsAppText: (billId) => api.get(`/billing/${billId}/whatsapp/`),
};

export const kitchenApi = {
  getQueue: () => api.get('/kitchen/queue/'),
  updateItem: (itemId, status) => api.patch(`/kitchen/item/${itemId}/`, { status }),
  markReady: (orderId) => api.patch(`/kitchen/order/${orderId}/ready/`),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard/'),
  getRevenueChart: (period = 'daily') => api.get('/analytics/revenue-chart/', { params: { period } }),
  getTopItems: () => api.get('/analytics/top-items/'),
  getOrderTypes: () => api.get('/analytics/order-types/'),
};
