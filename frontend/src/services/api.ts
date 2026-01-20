import axios from 'axios';

// 1. Defina a chave em uma constante para evitar erros de digitação
const STORAGE_KEY = '@Taverna:token';

export const api = axios.create({
  baseURL: 'http://localhost:3333/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEY);

    if (token) {
      // Limpa aspas se o token foi salvo com JSON.stringify
      const cleanToken = token.replace(/["']/g, '').trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('@Taverna:user');

      if (!window.location.pathname.includes('login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
