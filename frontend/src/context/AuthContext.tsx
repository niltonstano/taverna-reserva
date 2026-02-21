import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { AuthContextData, AuthProviderProps, SignInCredentials, User } from '../types/auth';

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // 🛡️ 1. ESTADO INICIAL SÍNCRONO (Evita deslogar no F5)
  const [user, setUser] = useState<User | null>(() => {
    const storageToken = localStorage.getItem('@Taverna:token');
    const storageUser = localStorage.getItem('@Taverna:user');

    if (storageToken && storageUser) {
      try {
        // Validação rápida de expiração antes de inicializar
        const payload = JSON.parse(window.atob(storageToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return null;
        }

        // ✅ Configura o Axios imediatamente antes do App renderizar
        api.defaults.headers.common['Authorization'] = `Bearer ${storageToken}`;
        return JSON.parse(storageUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false); // Já inicia como false pois o check é síncrono no useState

  // 🚪 2. FUNÇÃO DE LOGOUT (Memorizada)
  const signOut = useCallback(() => {
    localStorage.removeItem('@Taverna:token');
    localStorage.removeItem('@Taverna:user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);

    const publicPaths = ['/', '/catalog', '/login', '/register', '/admin/login'];
    const isPublic = publicPaths.some((path) => location.pathname === path || location.pathname.startsWith('/product/'));

    if (!isPublic) {
      navigate('/login');
    }
  }, [navigate, location.pathname]);

  // 🔑 3. FUNÇÃO DE LOGIN
  async function signIn({ email, password }: SignInCredentials) {
    setLoading(true);
    try {
      const isAdminPath = window.location.pathname.includes('/admin');
      const endpoint = isAdminPath ? '/auth/admin/login' : '/auth/customer/login';

      const response = await api.post(endpoint, { email, password });
      const { token, user: userResponse } = response.data;

      localStorage.setItem('@Taverna:token', token);
      localStorage.setItem('@Taverna:user', JSON.stringify(userResponse));

      // ✅ Atualiza Axios para chamadas futuras
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userResponse);

      // Redirecionamento baseado no cargo
      if (userResponse.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Falha na autenticação';
      console.error('Erro na autenticação:', message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  // 🔄 4. INTERCEPTOR DE SEGURANÇA (Opcional, mas recomendado para produção)
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          signOut();
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [signOut]);

  return <AuthContext.Provider value={{ user, loading, signIn, signOut, isLogged: !!user }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}
