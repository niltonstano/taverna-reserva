import { useEffect, useState } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  // 1. Carregar favoritos ao montar o hook (Blindado)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('@taverna:favorites');
      if (stored) {
        const parsed = JSON.parse(stored);

        // Verifica se é um array antes de salvar no estado
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        } else {
          // Se o dado existir mas não for um array, remove para limpar o erro
          localStorage.removeItem('@taverna:favorites');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos corrompidos:', error);
      localStorage.removeItem('@taverna:favorites');
    }
  }, []);

  // 2. Função para alternar favoritos (Segura e Otimizada)
  const toggleFavorite = (id: number) => {
    // Usamos o retorno da função setFavorites para garantir que temos o estado mais atual
    setFavorites((prev) => {
      const isAlreadyFav = prev.includes(id);
      const newFavorites = isAlreadyFav ? prev.filter((favId) => favId !== id) : [...prev, id];

      // Sincroniza com o LocalStorage
      localStorage.setItem('@taverna:favorites', JSON.stringify(newFavorites));

      return newFavorites;
    });
  };

  // 3. Função de verificação
  const isFavorite = (id: number) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite };
}
