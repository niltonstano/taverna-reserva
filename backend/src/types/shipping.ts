// src/types/shipping.ts

export interface ShippingItem {
  productId: string; // Alterado de 'id' para 'productId'
  quantity: number;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
}

export interface CalculateShippingBody {
  cep: string;
  items: ShippingItem[];
}
