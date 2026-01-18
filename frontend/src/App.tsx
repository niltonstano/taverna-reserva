import { BrowserRouter as Router } from 'react-router-dom';
import { Header } from './components/common/Header';
import { ScrollToTop } from './components/common/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AppRoutes } from './routes';

export default function App() {
  return (
    // ✅ O Router deve ser o PAI de todos para que o useNavigate funcione no AuthContext
    <Router>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <div className="min-h-screen bg-[#050505] flex flex-col overflow-x-hidden selection:bg-[#c2410c] selection:text-white">
            <Header />
            <main className="flex-grow">
              <AppRoutes />
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
