import { model, Schema, Document, Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: [1, "Mínimo 1"] },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true, // Já cria o índice automaticamente
    },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

// Índice de expiração (30 dias) - Único manual necessário
CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const CartModel = model<ICart>("Cart", CartSchema);