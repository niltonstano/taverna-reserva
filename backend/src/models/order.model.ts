import mongoose, { Document, Schema, Types } from "mongoose"; // Importamos o objeto mongoose completo
import { ORDER_STATUSES, OrderStatus } from "../types/order.type.js";

/**
 * ✅ Interface para os Sub-itens
 */
interface IOrderSubItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

/**
 * ✅ Interface do Documento (Mongoose)
 */
export interface IOrderDocument extends Document {
  userId: Types.ObjectId;
  items: IOrderSubItem[];
  totalPrice: number;
  status: OrderStatus;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Array.from(ORDER_STATUSES),
      default: "pending",
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * ✅ Índices para performance e segurança
 */
OrderSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
OrderSchema.index({ createdAt: -1 });

/**
 * ✅ Ajuste de Produção: Evita o erro "OverwriteModelError" ao reiniciar o servidor.
 * Verificamos se o modelo já existe no objeto 'models' do mongoose antes de criá-lo.
 */
export const OrderModel =
  mongoose.models.Order || mongoose.model<IOrderDocument>("Order", OrderSchema);
