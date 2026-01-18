import "fastify";
import "@fastify/jwt";

// 1. Definições de Domínio
export type UserRole = 'admin' | 'customer';

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  permissions?: string[]; // Mantemos opcional para flexibilidade
}

// 2. Extensão Global dos Módulos
declare module "fastify" {
  interface FastifyRequest {
    user: JWTPayload; 
    startTime?: number;
  }
  interface FastifyInstance {
    authenticate: (request: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}