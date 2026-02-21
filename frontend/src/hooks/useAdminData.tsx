import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

/**
 * Hook customizado para gerenciar dados da administração (Produtos, Clientes, Pedidos).
 * Implementa limpeza automática de cache local ao trocar de endpoint para evitar
 * sobreposição de dados (ex: vinhos aparecendo na aba de clientes).
 */
export function useAdminData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔥 LIMPEZA DE SEGURANÇA: Reseta o array antes de buscar novos dados.
      // Isso impede que os dados da aba anterior fiquem visíveis por erro de estado.
      setData([]);

      const response = await api.get(endpoint);

      // Lógica de Extração Inteligente:
      // Garante compatibilidade com retornos em Array direto ou Objetos aninhados.
      const rawData = response.data;
      let extractedData: T[] = [];

      if (Array.isArray(rawData)) {
        extractedData = rawData;
      } else if (rawData && typeof rawData === 'object') {
        // Tenta extrair de chaves comuns do Fastify/Express
        extractedData = rawData.customers || rawData.products || rawData.orders || rawData.users || rawData.data || [];
      }

      setData(extractedData);
    } catch (err: any) {
      // Log detalhado no console para debug de Erros 500
      console.error(`[Admin API Error] Falha ao acessar: ${endpoint}`, {
        status: err.response?.status,
        message: err.response?.data?.message || err.message,
        details: err.response?.data,
      });

      // Se o servidor falhar (Ex: Erro 500), garantimos lista vazia e aviso ao usuário
      setData([]);
      setError(err.response?.data?.message || 'Falha na conexão com o servidor da Taverna.');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    // Só executa se o endpoint for válido
    if (endpoint) {
      fetchData();
    }
  }, [fetchData, endpoint]);

  return {
    data,
    setData,
    loading,
    error,
    refresh: fetchData,
  };
}
