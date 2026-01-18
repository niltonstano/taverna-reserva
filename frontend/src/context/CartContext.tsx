import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. Interface flexível: Aceita ID como string ou number e campos duplos
export interface CartItem {
  id: number | string; // Flexível
  _id?: string | number;
  nome?: string;
  name?: string;
  preco?: string | number;
  price?: string | number;
  origem?: string;
  uva?: string;
  imagem?: string;
  quantity: number;
}

interface CartContextData {
  cart: CartItem[];
  cartCount: number;
  addToCart: (product: any) => void;
  removeFromCart: (id: number | string) => void; // Aceita string
  updateQuantity: (id: number | string, delta: number) => void; // Aceita string
  clearCart: () => void;
}

const CartContext = createContext<CartContextData | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('@TavernaReserva:cart');
    try {
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('@TavernaReserva:cart', JSON.stringify(cart));
  }, [cart]);

  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);

  const addToCart = (product: any) => {
    setCart((prev) => {
      // Pega o ID independente de como ele venha
      const productId = product.id || product._id;

      const exists = prev.find((item) => (item.id || item._id) === productId);

      if (exists) {
        return prev.map((item) => ((item.id || item._id) === productId ? { ...item, quantity: (item.quantity || 0) + 1 } : item));
      }

      // Garante que o item novo tenha ao menos a chave 'id' e 'quantity'
      return [...prev, { ...product, id: productId, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number | string) => {
    setCart((prev) => prev.filter((item) => (item.id || item._id) !== id));
  };

  const updateQuantity = (id: number | string, delta: number) => {
    setCart((prev) => prev.map((item) => ((item.id || item._id) === id ? { ...item, quantity: Math.max(1, (item.quantity || 0) + delta) } : item)));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('@TavernaReserva:cart');
  };

  return <CartContext.Provider value={{ cart, cartCount, addToCart, removeFromCart, updateQuantity, clearCart }}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};
