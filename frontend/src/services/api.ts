import axios from 'axios';

const STORAGE_KEY = '@Taverna:token';

export const api = axios.create({
  // Se a sua env for 'http://...:3333/api/v1', o backend deve estar configurado sem o prefixo duplicado
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1',
  timeout: 15000,
});

// --- INTERCEPTOR DE REQUEST ---
api.interceptors.request.use(
  (config) => {
    // 1. Log de diagnóstico
    console.log(`📡 [API] Request: ${config.method?.toUpperCase()} ${config.url}`);

    // 2. Tratamento do Token
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      if (token) {
        // Limpeza segura: remove aspas e espaços
        const cleanToken = token.replace(/["']/g, '').trim();
        config.headers.Authorization = `Bearer ${cleanToken}`;
      }
    } catch (e) {
      console.error('⚠️ Erro ao ler token do localStorage', e);
    }

    // 3. Normalização de Headers (Idempotency-Key)
    if (config.headers) {
      const idempKey = Object.keys(config.headers).find((k) => k.toLowerCase() === 'idempotency-key');
      if (idempKey) {
        const val = config.headers[idempKey];
        delete config.headers[idempKey];
        config.headers['idempotency-key'] = String(val);
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Erro antes de enviar a request:', error);
    return Promise.reject(error);
  },
);

// --- INTERCEPTOR DE RESPONSE ---
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] Sucesso: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    // 1. Tratamento de Cancelamento (React Strict Mode / AbortController)
    // Isso evita que o erro 'canceled' suje o seu console com logs vermelhos
    if (axios.isCancel(error)) {
      console.log('☁️ [API] Request cancelada pelo cliente (limpeza de componente)');
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const data = error.response?.data;

    // 2. Log detalhado de erro real
    console.error(`🔴 [API] Erro ${status || 'Network'}:`, data || error.message);

    if (status === 400) {
      console.warn('❌ Erro de Validação (Zod/Fastify):', data);
    }

    if (status === 401) {
      console.warn('🔒 Token inválido ou expirado. Redirecionando...');
      // localStorage.removeItem(STORAGE_KEY);
    }

    // 3. Formatação da mensagem de erro para o Frontend
    const message = data?.message || data?.error || 'Erro interno na conexão';

    // Retornamos um objeto de erro padronizado
    return Promise.reject({
      ...error,
      message,
      status,
    });
  },
);
