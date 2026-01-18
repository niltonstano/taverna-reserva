import { z } from "zod";

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusSchema = z.enum(ORDER_STATUSES);

const orderItemResponseSchema = z
  .object({
    productId: z.any(),
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
    subtotal: z.number().optional(),
  })
  .passthrough();

export const orderResponseSchema = z
  .object({
    _id: z.any(),
    userId: z.any(),
    customerEmail: z.string().optional(),
    items: z.array(orderItemResponseSchema),
    totalPrice: z.number(), // ✅ Sincronizado com Mongoose e Controller
    status: orderStatusSchema,
    idempotencyKey: z.string().optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
  })
  .passthrough();

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

export interface OrderReadModel {
  _id: { toString(): string };
  userId: string;
  items: OrderItem[];
  totalPrice: number; // ✅ O TS agora vai encontrar essa propriedade!
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
