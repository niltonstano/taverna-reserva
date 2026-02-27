import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import type { Product } from '../types/product';

export function useCartActions() {
  const { setCart, isLogged } = useCart();

  const addToCart = async (product: Product) => {
    const productId = product._id;

    setCart((prev) => {
      const exists = prev.find((item) => item._id === productId);
      if (exists) {
        return prev.map((item) => (item._id === productId ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    if (isLogged()) {
      try {
        await api.post('/cart/items', { productId, quantity: 1 });
      } catch (error) {
        console.warn('⚠️ Erro ao sincronizar adição:', error);
      }
    }
  };

  const removeFromCart = async (id: string) => {
    setCart((prev) => prev.filter((item) => item._id !== id));

    if (isLogged()) {
      try {
        await api.delete(`/cart/items/${id}`);
      } catch (error) {
        console.error('⚠️ Erro ao remover item:', error);
      }
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    let finalQty = 0;

    setCart((prev) =>
      prev.map((item) => {
        if (item._id === id) {
          finalQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: finalQty };
        }
        return item;
      }),
    );

    if (isLogged()) {
      try {
        await api.patch(`/cart/items/${id}`, { quantity: finalQty });
      } catch (error) {
        console.error('⚠️ Erro ao atualizar quantidade:', error);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('@TavernaReserva:cart');

    if (isLogged()) {
      try {
        await api.delete('/cart/clear');
      } catch (error) {
        console.error('⚠️ Erro ao limpar carrinho:', error);
      }
    }
  };

  return {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}
