import fastifyCompress from "@fastify/compress";
import fastifyHelmet from "@fastify/helmet";
import { randomUUID } from "crypto";
import Fastify, { FastifyInstance } from "fastify";

import corsPlugin from "./plugins/cors.js";
import jwtPlugin from "./plugins/jwt.js";
import envPlugin from "./plugins/plugin.env.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import zodPlugin from "./plugins/zod.js";
import { appRoutes } from "./routes/routes.js";
import { errorHandler } from "./utils/error.handler.js";

/**
 * BuildApp: Fábrica do Servidor Fastify
 * Configurada com máxima segurança (Helmet, Rate Limit, Sanitização Zod)
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    trustProxy: true,
    bodyLimit: 1048576, // 1MB (Proteção contra Payload Gigante)
    genReqId: () => randomUUID(),
    logger:
      process.env.NODE_ENV === "production"
        ? { level: "warn" }
        : { level: "info" },
  });

  // --- 1. CONFIGURAÇÕES BASE & ERROS ---
  app.setErrorHandler(errorHandler);
  await app.register(envPlugin);

  // --- 2. SEGURANÇA E PERFORMANCE ---
  // CORS registrado ANTES do Helmet para evitar problemas de Pre-flight (OPTIONS)
  await app.register(corsPlugin);

  await app.register(fastifyHelmet, {
    // CSP desativado para facilitar comunicação com o Dashboard,
    // mas os outros 11 headers de segurança do Helmet continuam ativos.
    contentSecurityPolicy: false,
  });

  await app.register(rateLimitPlugin); // Proteção contra Brute Force e DoS
  await app.register(fastifyCompress); // Otimização de banda (Gzip/Brotli)

  // --- 3. CORE (Validação, Docs e Auth) ---
  await app.register(zodPlugin); // Ativa a serialização/validação via Zod
  await app.register(swaggerPlugin); // Documentação automática da API
  await app.register(jwtPlugin); // Sistema de Tokens para Auth

  // --- 4. CARREGAMENTO DE ROTAS ---
  // Registra o orquestrador que contém todos os prefixos (/api/v1/...)
  await app.register(appRoutes);

  // --- 5. CICLO DE VIDA ---
  app.ready((err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }

    // Log limpo em vez do printRoutes fatiado
    const mode = process.env.NODE_ENV || "development";
    app.log.info(`✅ Estrutura de rotas injetada com sucesso [${mode}]`);
  });

  return app;
}
