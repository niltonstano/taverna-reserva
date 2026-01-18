import { Document, Types } from "mongoose";

export interface IAdmin {
  name: string;
  email: string;
  password?: string; // Obrigatório para o Seed
  role: "admin";
  permissions: string[];
}

export interface IAdminDocument extends IAdmin, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}