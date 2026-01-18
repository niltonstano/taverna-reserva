import mongoose, { Schema, Document, Types } from "mongoose";

/**
 * Interface de Dados Puros (POJO)
 * Representa a estrutura do objeto no banco.
 */
export interface ICustomerData {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface do Documento Mongoose
 */
export interface ICustomer extends Document, ICustomerData {}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { 
      type: String, 
      required: [true, "Nome é obrigatório"], 
      trim: true 
    },
    email: { 
      type: String, 
      required: [true, "E-mail é obrigatório"], 
      unique: true, // Já cria o índice único automaticamente
      lowercase: true, 
      trim: true
    },
    password: { 
      type: String, 
      required: [true, "Senha é obrigatória"],
      select: false // Segurança: oculta a senha em consultas por padrão
    },
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

// Se houver qualquer schema.index manual aqui, certifique-se de que não é para o e-mail.

export const CustomerModel = mongoose.model<ICustomer>("Customer", CustomerSchema);