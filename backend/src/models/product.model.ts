import { Document, Schema, Types, model } from "mongoose";

export interface IProduct {
  name: string;
  price: number;
  category: string;
  image_url?: string;
  description?: string;
  safra?: string;
  uva?: string;
  origem?: string;
  pontuacao?: number;
  emOferta?: boolean;
  active?: boolean;
  stock: number;
}

export interface IProductDocument extends IProduct, Document {
  _id: Types.ObjectId;
}

const productSchema = new Schema<IProductDocument>(
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
    // Alterado para vazio para não forçar a imagem do Rioja em novos cadastros
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
  }
);

productSchema.pre("save", function (next) {
  if (this.category) {
    this.category = this.category.trim();
  }
  next();
});

export const ProductModel = model<IProductDocument>("Product", productSchema);
