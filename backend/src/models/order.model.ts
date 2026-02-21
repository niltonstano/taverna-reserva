import mongoose, { Document, Schema, Types } from "mongoose";
import { ORDER_STATUSES, OrderStatus } from "../types/order.type.js"; // 👈 Importamos a constante correta

/**
 * ✅ Interface do Documento no Banco
 */
export interface IOrderDB extends Document {
  userId: Types.ObjectId;
  customerEmail: string;
  idempotencyKey: string;
  items: {
    productId: Types.ObjectId;
    name: string;
    quantity: number;
    priceCents: number;
    subtotalCents: number;
  }[];
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
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrderDB>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
      index: true,
    },
    customerEmail: { type: String, required: true },
    idempotencyKey: { type: String, required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        priceCents: { type: Number, required: true },
        subtotalCents: { type: Number, required: true },
      },
    ],
    totalPriceCents: { type: Number, required: true },
    shippingPriceCents: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    address: { type: String, required: true },
    zipCode: { type: String, required: true },
    shipping: {
      service: { type: String, required: true },
      company: { type: String, required: true },
      priceCents: { type: Number, required: true },
      deadline: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// 🛡️ Segurança: Índice único composto para Idempotência
orderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });

export const OrderModel =
  mongoose.models.Order || mongoose.model<IOrderDB>("Order", orderSchema);
