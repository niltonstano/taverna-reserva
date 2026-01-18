import { Document, Types } from "mongoose";

export interface ICustomer {
  name: string;
  email: string;
  password: string;
  role: 'customer';
}

export interface ICustomerDocument extends ICustomer, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}