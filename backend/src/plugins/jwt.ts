import jwt, { FastifyJWTOptions } from "@fastify/jwt";
import fp from "fastify-plugin";
import { env } from "../config/env.js";

export default fp(async (app) => {
  const jwtOptions: FastifyJWTOptions = {
    secret: env.JWT_SECRET || "fallback-secret-dev",
    messages: {
      badRequestErrorMessage: "Formato de token inválido",
      noAuthorizationInHeaderMessage: "Token de autorização não fornecido",
      authorizationTokenExpiredMessage: "Token expirado",
      authorizationTokenInvalid: "Token inválido",
    },
    sign: {
      expiresIn: "7d", // Recomendo um tempo maior ou uso de Refresh Tokens em produção
    },
  };

  // 1. Registra o plugin oficial do Fastify
  app.register(jwt, jwtOptions);

  /**
   * NOTA: Não decoramos o 'authenticate' aqui dentro se você já o exportou
   * de um arquivo separado (como fizemos no passo anterior).
   * Isso evita duplicidade e mantém a lógica de auth isolada.
   */
});
