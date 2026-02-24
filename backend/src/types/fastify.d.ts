import "@fastify/jwt";
import "fastify";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    config: typeof env;
    // Adicione o JWT como plugin declarado
    jwt: import("@fastify/jwt").FastifyJWT;
  }
  interface FastifyRequest {
    startTime: number;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      role: "admin" | "customer";
      permissions?: string[];
    };
    // 'user' é o que fica em request.user após verify()
    user: {
      id: string;
      email: string;
      role: "admin" | "customer";
      permissions?: string[];
    };
  }
}
