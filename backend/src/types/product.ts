import { z } from "zod";
import { productSchema } from "../schemas/product.schema.js";

export type ProductInput = z.infer<typeof productSchema>;

export interface IProductDocument extends ProductInput {
  _id: { toString(): string };
  toObject: (options?: object) => ProductInput & { _id: { toString(): string } };
  // ✅ Isso permite que o objeto do Mongoose seja compatível com sua interface
  [key: string]: unknown; 
}

export interface IProductResponse extends Omit<ProductInput, "_id"> {
  _id: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}