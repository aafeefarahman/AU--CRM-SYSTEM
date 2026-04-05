import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Leads from './pages/Leads';
import Activities from './pages/Activities';
import Users from './pages/Users';
import Profile from './pages/Profile';

function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { token } = useAuthStore();
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
      <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
