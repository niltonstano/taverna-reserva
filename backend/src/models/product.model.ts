import { Document, Schema, Types, model } from "mongoose";

export interface IProduct {
  _id: Types.ObjectId | string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  type?: string;
  active: boolean;
  emOferta?: boolean;
  safra?: string;
  uva?: string;
  origem?: string;
  pontuacao?: number;
  featured?: boolean;
  weight: number;
  dimensions: { width: number; height: number; length: number };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductDB extends Omit<IProduct, "_id">, Document {
  _id: Types.ObjectId;
}

const ProductSchema = new Schema<IProductDB>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },

    category: {
      type: String,
      required: true,
      index: true,
      enum: {
        values: ["Vinho", "Espumantes", "Destilados", "Acessórios", "Geral"],
        message: "{VALUE} não é uma categoria válida",
      },
      default: "Vinho",
    },

    type: { type: String, trim: true, default: "Tinto" },

    // Manter apenas imageUrl para padronizar. O transform cuida da migração.
    imageUrl: { type: String, trim: true, default: "" },

    active: { type: Boolean, default: true, index: true },
    emOferta: { type: Boolean, default: false },
    safra: { type: String, trim: true, default: "N/V" },
    uva: { type: String, trim: true, default: "Blend" },
    origem: { type: String, trim: true, default: "Não Informada" },
    pontuacao: { type: Number, min: 0, max: 100, default: 0 },
    featured: { type: Boolean, default: false },

    weight: { type: Number, default: 1.5 },
    dimensions: {
      width: { type: Number, default: 10 },
      height: { type: Number, default: 33 },
      length: { type: Number, default: 10 },
    },
  },
  {
    timestamps: true,
    // Sem strict: false para garantir que lixo não entre no banco
    strict: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        // Compatibilidade com campos antigos durante a transição
        ret.imageUrl = ret.imageUrl || ret.image_url || "";
        delete ret.image_url;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ✅ Índices de busca otimizados
ProductSchema.index({ name: "text", category: "text" });

export const ProductModel = model<IProductDB>("Product", ProductSchema);
