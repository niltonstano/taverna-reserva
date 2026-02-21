import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Interface de Dados Puros (POJO)
 * Define a estrutura que sai do banco quando usamos .lean()
 */
export interface ICustomerData {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: "admin" | "customer";
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface do Documento Mongoose
 * Estende Document para quando você usa métodos de instância (.save(), etc)
 */
export interface ICustomer extends Document, Omit<ICustomerData, "_id"> {
  _id: Types.ObjectId;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "E-mail é obrigatório"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Senha é obrigatória"],
      select: false, // Segurança: oculta a senha em consultas por padrão
    },
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const CustomerModel = mongoose.model<ICustomer>(
  "Customer",
  CustomerSchema,
);
