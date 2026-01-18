import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  roleRequired?: 'admin' | 'customer';
}

export function ProtectedRoute({ children, roleRequired }: ProtectedRouteProps) {
  // ✅ Trocado 'authenticated' por 'isLogged'
  const { user, isLogged, loading } = useAuth();
  const location = useLocation();

  // ⏳ Fase de Re-hidratação: evita redirecionamento falso enquanto lê o Storage
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#c2410c] font-serif italic">
        <span>Sincronizando adega...</span>
      </div>
    );
  }

  // 1. Bloqueio por falta de Autenticação
  // ✅ Usando 'isLogged' aqui também
  if (!isLogged) {
    const loginPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 2. Bloqueio por Hierarquia (Role-Based Access Control)
  if (roleRequired && user?.role !== roleRequired) {
    // ADMIN tem acesso total
    if (user?.role === 'admin' && roleRequired === 'customer') {
      return children;
    }

    console.warn(`Acesso negado: Usuário ${user?.role} tentou acessar rota de ${roleRequired}`);
    return <Navigate to="/" replace />;
  }

  return children;
}
