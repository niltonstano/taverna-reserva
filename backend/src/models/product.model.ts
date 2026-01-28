import { HydratedDocument, Schema, model } from "mongoose";
import { IProduct } from "../interfaces/product.interface.js";

/** Documento do Mongoose (instância real do banco) */
export type IProductDocument = HydratedDocument<IProduct>;

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, index: true },
    image_url: { type: String, default: "" },
    description: { type: String, default: "" },
    safra: { type: String, trim: true, default: "N/V" },
    uva: { type: String, trim: true, default: "Varietal" },
    origem: { type: String, trim: true, default: "Internacional" },
    pontuacao: { type: Number, default: 0 },
    emOferta: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    stock: { type: Number, required: true, default: 10 },
  },
  {
    timestamps: true,
    versionKey: "__v",
  },
);

productSchema.pre("save", function (next) {
  if (this.category) this.category = this.category.trim();
  next();
});

export const ProductModel = model<IProduct>("Product", productSchema);
