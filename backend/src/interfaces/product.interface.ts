import { Types } from "mongoose";

/**
 * Estrutura base de um produto no sistema
 */
export interface IProduct {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url?: string;
  active?: boolean;
  emOferta?: boolean;
  safra?: string;
  uva?: string;
  origem?: string;
  pontuacao?: number;
}

/**
 * Produto no formato "lean" (retornado do Mongo via .lean())
 * Inclui o _id como ObjectId
 */
export interface IProductLean extends IProduct {
  _id: Types.ObjectId;
}
