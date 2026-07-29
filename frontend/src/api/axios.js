import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://restaurantapp-uiua.onrender.com').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token (except for public customer QR ordering routes)
api.interceptors.request.use((config) => {
  const isPublicCustomerRoute = window.location.pathname.startsWith('/order/');
  const token = localStorage.getItem('access_token');
  if (token && !isPublicCustomerRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 & unwrap paginated DRF responses
api.interceptors.response.use(
  (res) => {
    // Transparently unwrap Django paginated responses {count, results:[]}
    if (res.data && typeof res.data === 'object' && 'results' in res.data && 'count' in res.data) {
      res.data = res.data.results;
    }
    return res;
  },
  async (error) => {
    const isPublicCustomerRoute = window.location.pathname.startsWith('/order/');
    const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/token') || window.location.pathname === '/login' || window.location.pathname === '/';

    if (error.response?.status === 401) {
      if (isPublicCustomerRoute || isAuthRoute) {
        // Return promise rejection cleanly to UI without page reloads
        return Promise.reject(error);
      }

      const refresh = localStorage.getItem('refresh_token');
      if (refresh && !error.config._retry) {
        error.config._retry = true;
        try {
          const r = await axios.post(`${API_BASE}/api/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', r.data.access);
          error.config.headers.Authorization = `Bearer ${r.data.access}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
