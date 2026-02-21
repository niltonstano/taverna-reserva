import { Document, Types } from "mongoose";

/**
 * 🏷️ CONSTANTES E TIPOS DE STATUS
 */
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * 💳 PAGAMENTO - DADOS DE RETORNO
 */
export interface PaymentData {
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
  payment_id: number;
}

/**
 * 🏗️ INTERFACE BASE (MODELO DE DADOS)
 */
export interface IOrder {
  userId: Types.ObjectId;
  customerEmail: string;
  idempotencyKey: string;
  items: Array<{
    productId: Types.ObjectId;
    name: string;
    priceCents: number;
    quantity: number;
    subtotalCents: number;
  }>;
  totalPriceCents: number;
  shippingPriceCents: number;
  status: OrderStatus;
  address: string;
  zipCode: string;
  shipping: {
    service: string;
    company: string;
    priceCents: number;
    deadline: number;
  };
}

export type IOrderDocument = IOrder &
  Document & { createdAt: Date; updatedAt: Date };

export interface IOrderEntity extends IOrder {}
export interface OrderCreateInput extends IOrder {}

/**
 * 🛒 CHECKOUT - ENTRADA
 */
export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutBody {
  address: string;
  zipCode: string;
  total: number;
  shipping: {
    service: string;
    price: number;
    deadline: number;
    company?: string;
  };
  items: CheckoutItem[];
}

/**
 * 📦 CHECKOUT - SAÍDA (O QUE A API RETORNA)
 */
export interface CheckoutResult {
  order: {
    _id: Types.ObjectId | string;
    userId: Types.ObjectId | string;
    customerEmail: string;
    totalPriceCents: number;
    status: string;
    idempotencyKey: string;
    items: Array<{
      productId: Types.ObjectId | string;
      name: string;
      priceCents: number;
      quantity: number;
      subtotalCents: number;
    }>;
    shipping: {
      service: string;
      company: string;
      priceCents: number;
      deadline: number;
    };
    address: string;
    zipCode: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
  payment_data: PaymentData; // ✅ Usando a interface exportada acima
}

export interface IOrderDTO extends Omit<IOrder, "userId" | "items"> {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    productId: string;
    name: string;
    priceCents: number;
    quantity: number;
    subtotalCents: number;
  }>;
}
