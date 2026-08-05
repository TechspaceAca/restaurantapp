import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import { authApi } from './api';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import MenuManager from './pages/admin/MenuManager';
import TableSetup from './pages/admin/TableSetup';
import StaffList from './pages/admin/StaffList';
import Settings from './pages/admin/Settings';
import TablesView from './pages/staff/TablesView';
import TakeOrder from './pages/staff/TakeOrder';
import BillingPage from './pages/staff/Billing';
import OrderHistory from './pages/staff/OrderHistory';
import OnlineOrders from './pages/admin/OnlineOrders';
import KitchenScreen from './pages/kitchen/KitchenScreen';
import CustomerOrder from './pages/customer/CustomerOrder';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

function RoleRedirect() {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'kitchen') return <Navigate to="/kitchen" replace />;
  return <Navigate to="/pos" replace />;
}

export default function App() {
  const theme = useStore(state => state.theme);
  const setRestaurantSettings = useStore(state => state.setRestaurantSettings);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'dark');
  }, [theme]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authApi.getSettings();
        setRestaurantSettings(res.data);
      } catch (e) {
        console.error("Failed to load restaurant settings", e);
      }
    };
    fetchSettings();
  }, [setRestaurantSettings]);

  return (
    <HashRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a24',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/order/:qrToken" element={<CustomerOrder />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="history" element={<OrderHistory />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="tables" element={<TableSetup />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="settings" element={<Settings />} />
          <Route path="online" element={<OnlineOrders />} />
        </Route>

        {/* Staff/POS Routes */}
        <Route path="/pos" element={
          <ProtectedRoute allowedRoles={['staff', 'admin']}>
            <StaffLayout />
          </ProtectedRoute>
        }>
          <Route index element={<TablesView />} />
          <Route path="order" element={<TakeOrder />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>

        {/* Kitchen */}
        <Route path="/kitchen" element={
          <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
            <KitchenScreen />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="/unauthorized" element={
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
            <div style={{ fontSize:48 }}>🚫</div>
            <h2 style={{ color:'#f1f5f9' }}>Access Denied</h2>
            <a href="/login" style={{ color:'#f97316' }}>← Back to Login</a>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
