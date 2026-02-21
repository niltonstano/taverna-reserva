import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Address, CartItem, ShippingOption } from '../types/cart';

// --- INTERFACES ---
interface CartState {
  cart: CartItem[];
  cartCount: number;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  isLogged: () => boolean;
  // Estados de Frete
  address: Address | null;
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;
  isCalculating: boolean;
}

interface CartActions {
  addToCart: (product: any) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  // Ações de Frete
  calculateShipping: (zipCode: string) => Promise<void>;
  setSelectedShipping: (option: ShippingOption) => void;
}

const CartStateContext = createContext<CartState | undefined>(undefined);
const CartActionsContext = createContext<CartActions | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('@TavernaReserva:cart');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Novos estados para Frete
  const [address, setAddress] = useState<Address | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const isLogged = useCallback(() => !!localStorage.getItem('@Taverna:token'), []);

  useEffect(() => {
    localStorage.setItem('@TavernaReserva:cart', JSON.stringify(cart));
  }, [cart]);

  const cartCount = useMemo(() => cart.reduce((acc, i) => acc + (i.quantity || 0), 0), [cart]);

  // --- LÓGICA DE FRETE (MELHOR ENVIO) ---
  const calculateShipping = useCallback(
    async (zipCode: string) => {
      if (zipCode.length < 8) return;
      setIsCalculating(true);

      try {
        // Chama sua API que processa com o token do Melhor Envio
        const response = await api.post('/shipping/calculate', {
          zipCode,
          items: cart.map((item) => ({
            id: item._id || item.id,
            quantity: item.quantity,
          })),
        });

        // Supondo que sua API retorne as opções e os dados do endereço
        setShippingOptions(response.data.options || []);
        setAddress(response.data.address || null);
      } catch (err) {
        console.error('Erro ao calcular frete:', err);
      } finally {
        setIsCalculating(false);
      }
    },
    [cart],
  );

  // --- AÇÕES DO CARRINHO ---
  const addToCart = useCallback(
    async (product: any) => {
      const id = String(product._id || product.id);
      setCart((prev) => {
        const existing = prev.find((item) => String(item._id || item.id) === id);
        if (existing) {
          return prev.map((item) => (String(item._id || item.id) === id ? { ...item, quantity: item.quantity + 1 } : item));
        }
        return [...prev, { ...product, quantity: 1 }];
      });

      if (isLogged()) {
        try {
          await api.post('/cart/items', { productId: id, quantity: 1 });
        } catch (err) {
          console.warn('Falha ao sincronizar adição');
        }
      }
    },
    [isLogged],
  );

  const removeFromCart = useCallback(
    async (id: string) => {
      setCart((prev) => prev.filter((item) => String(item._id || item.id) !== id));
      if (isLogged()) {
        try {
          await api.delete(`/cart/items/${id}`);
        } catch (err) {
          console.warn('Falha ao remover');
        }
      }
    },
    [isLogged],
  );

  const updateQuantity = useCallback(
    async (id: string, delta: number) => {
      let newQty = 0;
      setCart((prev) =>
        prev.map((item) => {
          if (String(item._id || item.id) === id) {
            newQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        }),
      );

      if (isLogged() && newQty > 0) {
        try {
          await api.patch(`/cart/items/${id}`, { quantity: newQty });
        } catch (err) {
          console.warn('Falha ao atualizar quantidade');
        }
      }
    },
    [isLogged],
  );

  const clearCart = useCallback(async () => {
    setCart([]);
    if (isLogged()) {
      try {
        await api.delete('/cart/clear');
      } catch (err) {
        console.warn('Falha ao limpar servidor');
      }
    }
  }, [isLogged]);

  // --- MEMOS ---
  const stateValue = useMemo(
    () => ({
      cart,
      cartCount,
      setCart,
      isLogged,
      address,
      shippingOptions,
      selectedShipping,
      isCalculating,
    }),
    [cart, cartCount, isLogged, address, shippingOptions, selectedShipping, isCalculating],
  );

  const actionsValue = useMemo(
    () => ({
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      calculateShipping,
      setSelectedShipping,
    }),
    [addToCart, removeFromCart, updateQuantity, clearCart, calculateShipping],
  );

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartActionsContext.Provider value={actionsValue}>{children}</CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartStateContext);
  if (!context) throw new Error('useCart deve ser usado dentro de um CartProvider');
  return context;
};

export const useCartActions = () => {
  const context = useContext(CartActionsContext);
  if (!context) throw new Error('useCartActions deve ser usado dentro de um CartProvider');
  return context;
};
