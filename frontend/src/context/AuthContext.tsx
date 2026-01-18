import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

import type { AuthContextData, AuthProviderProps, SignInCredentials, User } from '../types/auth';

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Função de Sair (Centralizada)
  function signOut() {
    localStorage.removeItem('@Taverna:token');
    localStorage.removeItem('@Taverna:user');
    setUser(null);
    // Só redireciona se não estiver em rota pública
    const publicPaths = ['/', '/catalog', '/login', '/register', '/admin/login'];
    const isPublic = publicPaths.some((path) => location.pathname === path || location.pathname.startsWith('/product/'));

    if (!isPublic) {
      navigate('/login');
    }
  }

  // 2. Validação de Sessão (Executa apenas no carregamento inicial)
  useEffect(() => {
    function loadStorageData() {
      const storageToken = localStorage.getItem('@Taverna:token');
      const storageUser = localStorage.getItem('@Taverna:user');

      if (storageToken && storageUser) {
        try {
          // Validação básica de expiração de JWT
          const base64Url = storageToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          const now = Math.floor(Date.now() / 1000);

          if (payload.exp && payload.exp < now) {
            signOut();
          } else {
            setUser(JSON.parse(storageUser));
            // ✅ IMPORTANTE: Removido o navigate automático daqui!
            // Deixamos as rotas decidirem para onde ir.
          }
        } catch (error) {
          signOut();
        }
      }
      setLoading(false);
    }
    loadStorageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Vazio para rodar só UMA vez ao abrir o app

  // 3. Login
  async function signIn({ email, password }: SignInCredentials) {
    try {
      const isAdminPath = window.location.pathname.includes('/admin');
      const endpoint = isAdminPath ? '/auth/admin/login' : '/auth/customer/login';

      const response = await api.post(endpoint, { email, password });
      const { token, user: userResponse } = response.data;

      localStorage.setItem('@Taverna:token', token);
      localStorage.setItem('@Taverna:user', JSON.stringify(userResponse));

      setUser(userResponse);

      // Redireciona APENAS após o clique no botão de login
      if (userResponse.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      throw new Error(error.response?.data?.message || 'Falha na autenticação');
    }
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut, isLogged: !!user }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}
