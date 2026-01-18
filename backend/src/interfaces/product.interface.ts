import { Document, Types } from 'mongoose';

// 1. Interface apenas com os dados (usada para o Faker e criação)
export interface IProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  active: boolean;
}

// 2. Interface do Mongoose (usada no Model e Service)
export interface IProduct extends IProductData, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}