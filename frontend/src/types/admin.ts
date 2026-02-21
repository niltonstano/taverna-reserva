/**
 * Interfaces Base
 */
export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number | string;
  stock: number;
  image_url?: string;
  // ... outros campos de produto
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  username?: string;
}

// O segredo: AdminItem agora é explicitamente um OU outro.
export type AdminItem = Product | AdminUser;

// Atalhos para os Type Guards
export type AdminProduct = Product;
export type AdminCustomer = AdminUser;
