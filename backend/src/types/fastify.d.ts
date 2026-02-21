import "@fastify/jwt";
import "fastify";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    config: typeof env;
  }
  interface FastifyRequest {
    startTime: number;
    // Não defina 'user' aqui se estiver usando JWT, use o bloco abaixo.
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      role: "admin" | "customer";
      permissions?: string[];
    };
  }
}
