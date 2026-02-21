import type { Dispatch, SetStateAction } from 'react'; // Adicionado o 'type' aqui
import type { Product } from './product';

// 📦 Estrutura do item dentro do carrinho
export interface CartItem extends Product {
  quantity: number;
}

// 📍 Estrutura do Endereço para Frete
export interface Address {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

// 🚚 Opção de Frete vinda da API (Melhor Envio)
export interface ShippingOption {
  id: string | number;
  name: string;
  price: number;
  delivery_time: number;
  company: string;
  logo?: string;
}

// 🎴 Props do componente CartItemCard
export interface CartItemCardProps {
  item: CartItem;
  onUpdate: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  formatPrice: (price: number) => string;
  getCleanPrice: (price: any) => number;
}

// 🏛️ Contexto Completo (Estado + Ações)
export interface CartContextData {
  cart: CartItem[];
  setCart: Dispatch<SetStateAction<CartItem[]>>;
  cartCount: number;
  isLogged: () => boolean;

  // Frete e Endereço
  address: Address | null;
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;
  calculateShipping: (zipCode: string) => Promise<void>;
}
