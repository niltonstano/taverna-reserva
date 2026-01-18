import axios from 'axios';

// Criamos a instância base do Axios
export const api = axios.create({
  baseURL: 'http://localhost:3334/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * INTERCEPTOR DE REQUISIÇÃO
 * Adiciona o token em cada chamada feita ao backend
 */
api.interceptors.request.use(
  (config) => {
    // ✅ Obtém o token salvo no localStorage
    const token = localStorage.getItem('@Taverna:token');

    if (token) {
      // Limpa aspas extras que o JSON.stringify costuma colocar
      const cleanToken = token.replace(/["']/g, '').trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * INTERCEPTOR DE RESPOSTA
 * Monitora se o token expirou (Erro 401 ou 403)
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se o backend responder que o acesso é negado ou expirou
    if (error.response?.status === 401 || error.response?.status === 403) {
      // ✅ LIMPEZA DE SEGURANÇA: Remove os dados da sessão
      localStorage.removeItem('@Taverna:token');
      localStorage.removeItem('@Taverna:user');

      // ✅ REDIRECIONAMENTO: Apenas se o usuário já não estiver na página de login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/admin/login') {
        // Alerta opcional: console.warn('Sessão expirada. Redirecionando...');
        window.location.href = '/login';
      }
    }

    // Retorna o erro para que o componente que fez a chamada também possa tratá-lo se quiser
    return Promise.reject(error);
  },
);
