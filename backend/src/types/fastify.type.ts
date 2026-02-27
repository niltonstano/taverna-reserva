import "@fastify/jwt";
import "fastify";
import { env } from "../config/env.js";

// 1. Extraímos o tipo do objeto env para poder usá-lo na interface
type EnvType = typeof env;

export interface JWTPayload {
  id: string;
  permissions: string[];
}

declare module "fastify" {
  interface FastifyInstance {
    // 2. Usamos o tipo extraído aqui
    env: EnvType;
    authenticate: (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    startTime: number;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}
