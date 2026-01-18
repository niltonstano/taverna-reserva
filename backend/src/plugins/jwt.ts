import jwt, { FastifyJWTOptions } from "@fastify/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
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
      expiresIn: "2h",
    },
  };

  // Registra o plugin oficial
  app.register(jwt, jwtOptions);

  // Decora a instância do app com o método de autenticação
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        app.log.warn(`Tentativa de acesso não autorizado: ${request.ip}`);
        return reply.status(401).send({
          success: false,
          message: "Acesso negado: Credenciais inválidas",
          statusCode: 401,
        });
      }
    }
  );
});
