import "@fastify/jwt";
import "fastify";
import { Env } from "../config/env.js";

/**
 * Interface única para o Payload do Token e Usuário Autenticado.
 * Centraliza a estrutura de dados do usuário em todo o sistema.
 */
export interface JWTPayload {
  id: string;
  email: string;
  role: "admin" | "customer";
}

declare module "fastify" {
  interface FastifyInstance {
    env: Env;
  }

  interface FastifyRequest {
    startTime?: number;
    /**
     * ✅ Agora o TS sabe que 'request.user' sempre terá essa estrutura.
     */
    user: JWTPayload;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}
