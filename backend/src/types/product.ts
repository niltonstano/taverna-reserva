import { Types } from "mongoose";

export interface IProduct {
  _id: string | Types.ObjectId;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  active: boolean;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    length: number;
  };
  emOferta: boolean;
  safra?: string;
  uva?: string;
  origem?: string;
  pontuacao?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 🛡️ ADICIONE ESTA INTERFACE QUE ESTAVA FALTANDO
export interface ProductPaginationResult {
  products: IProduct[];
  total: number;
  pages: number;
}

export interface ICartItemPopulated {
  productId: IProduct;
  quantity: number;
}
