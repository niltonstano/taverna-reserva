import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// --- SHOP ---
import { Cart } from '../pages/shop/Cart';
import { Catalog } from '../pages/shop/Catalog';
import { Categories } from '../pages/shop/Categories';
import { Home } from '../pages/shop/Home';
import { Offers } from '../pages/shop/Offers';
import { ProductDetail } from '../pages/shop/ProductDetail';
import { Success } from '../pages/shop/Success';

// --- AUTH ---
import { AdminLogin } from '../pages/auth/AdminLogin';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';

// --- MEMBER ---
import { Club } from '../pages/member/Club';
import { Dashboard as MemberDashboard } from '../pages/member/Dashboard';
import { Tracking } from '../pages/member/Tracking';

// --- ADMIN ---
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminOrders } from '../pages/admin/AdminOrders';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/offers" element={<Offers />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/club" element={<Club />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roleRequired="customer">
            <MemberDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracking"
        element={
          <ProtectedRoute roleRequired="customer">
            <Tracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/success"
        element={
          <ProtectedRoute roleRequired="customer">
            <Success />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute roleRequired="admin">
            <AdminOrders />
          </ProtectedRoute>
        }
      />

      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
