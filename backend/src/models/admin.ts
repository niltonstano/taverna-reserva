import { Schema, model, Document, Types } from "mongoose";

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string; 
  role: "admin";
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true
    },
    password: { 
      type: String, 
      required: true,
      select: false 
    },
    role: { 
      type: String, 
      default: "admin", 
      enum: ["admin"],
      immutable: true
    },
    permissions: { 
      type: [String], 
      default: ["manage_products", "manage_orders"] 
    },
  },
  { 
    timestamps: true, 
    versionKey: false
  }
);

// O Mongoose já cria o índice único para o email automaticamente devido ao unique: true
export const AdminModel = model<IAdmin>("Admin", adminSchema);