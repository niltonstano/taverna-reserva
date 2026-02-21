import { Types } from "mongoose";

export type UserRole = "admin" | "customer";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  // Adicionamos o updatedAt aqui para não quebrar o schema no Front
  updatedAt?: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export type JWTPayload =
  | { id: string; email: string; role: "admin"; permissions: string[] }
  | { id: string; email: string; role: "customer" };

export interface IUserFields {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
