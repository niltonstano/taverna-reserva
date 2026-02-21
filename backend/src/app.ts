import fastifyCompress from "@fastify/compress";
import cors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import Fastify, { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

import database from "./plugins/database.js";
import jwtPlugin from "./plugins/jwt.js";
import envPlugin from "./plugins/plugin.env.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import zodPlugin from "./plugins/zod.js";
import { appRoutes } from "./routes/routes.js";
import { errorHandler } from "./utils/error.handler.js";

/**
 * 🛠 Module Augmentation
 * Garante que o TypeScript reconheça o objeto config em toda a aplicação.
 */
declare module "fastify" {
  interface FastifyInstance {
    config: {
      NODE_ENV: "production" | "development" | "test";
      PORT: number;
      HOST: string;
      LOG_LEVEL: string;
      JWT_SECRET: string;
      MONGO_URI: string;
      CORS_ORIGIN: string;
      [key: string]: any;
    };
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const isProd = process.env.NODE_ENV === "production";

  const app = Fastify({
    requestTimeout: 20_000,
    trustProxy: true,
    bodyLimit: 1_048_576, // 1MB
    genReqId: () => randomUUID(),
    logger: {
      level: isProd ? "info" : "debug",
      redact: ["req.headers.authorization", "req.body.password"],
      transport: isProd
        ? undefined
        : {
            target: "pino-pretty",
            options: { colorize: true },
          },
    },
  });

  try {
    // 1. Carregamento de Ambiente (Obrigatório vir primeiro e com await)
    // Isso garante que o decorator 'config' seja aplicado antes de ser usado.
    await app.register(envPlugin);
    app.setErrorHandler(errorHandler);

    // Captura segura das variáveis com fallback para o process.env do Docker
    const mongoUri = app.config?.MONGO_URI || process.env.MONGO_URI;
    const jwtSecret = app.config?.JWT_SECRET || process.env.JWT_SECRET;
    const corsOrigin = app.config?.CORS_ORIGIN || process.env.CORS_ORIGIN;

    // 2. Healthcheck (Contrato blindado para monitoramento)
    app.get(
      "/health",
      {
        schema: {
          response: {
            200: {
              type: "object",
              properties: {
                status: { type: "string" },
                uptime: { type: "number" },
                timestamp: { type: "string" },
              },
            },
          },
        },
      },
      async () => ({
        status: "UP",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }),
    );

    // 3. Segurança HTTP
    await app.register(fastifyHelmet, {
      global: true,
      contentSecurityPolicy: isProd ? undefined : false,
    });

    // 4. Configuração de CORS Dinâmico & Resiliente
    await app.register(cors, {
      origin: (origin, cb) => {
        if (!isProd || !origin) {
          return cb(null, true);
        }

        // Se o config ainda for undefined, usa o fallback que extraímos acima
        const rawAllowed = corsOrigin;

        if (!rawAllowed) {
          app.log.error("⚠️ CORS: CORS_ORIGIN não encontrada no ambiente.");
          return cb(null, true);
        }

        const allowedOrigins = String(rawAllowed)
          .split(",")
          .map((o) => o.trim());

        if (allowedOrigins.includes(origin) || origin.includes("localhost")) {
          return cb(null, true);
        }

        app.log.warn({ origin }, "🚫 CORS: Origem não permitida");
        return cb(null, false);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Accept",
        "x-request-id",
        "idempotency-key",
      ],
      credentials: true,
      maxAge: 86400,
    });

    // 5. Plugins de Infra (Usando as constantes extraídas para evitar TypeErrors)
    if (!mongoUri) {
      throw new Error("❌ Falha no Bootstrap: MONGO_URI não definida.");
    }
    await app.register(database, { uri: mongoUri });

    await app.register(zodPlugin);

    if (!jwtSecret) {
      throw new Error("❌ Falha no Bootstrap: JWT_SECRET não definida.");
    }
    await app.register(jwtPlugin, { secret: jwtSecret });

    // 6. Performance (Somente Produção)
    if (isProd) {
      await app.register(rateLimitPlugin);
      await app.register(fastifyCompress, { threshold: 1024 });
    }

    // 7. Rotas e Documentação
    await app.register(swaggerPlugin);
    await app.register(appRoutes, { prefix: "/api/v1" });

    // 8. Hook de Auditoria
    app.addHook("onResponse", async (request, reply) => {
      if (request.url !== "/health") {
        app.log.info(
          {
            requestId: request.id,
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            duration: `${Math.round(reply.elapsedTime)}ms`,
          },
          "Request Completed",
        );
      }
    });

    app.log.info("🏰 Taverna Engine inicializada com sucesso.");
  } catch (error) {
    app.log.fatal({ err: error }, "Falha Crítica no Bootstrap");
    process.exit(1);
  }

  setupGracefulShutdown(app);

  return app;
}

function setupGracefulShutdown(app: FastifyInstance) {
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.warn(`[SHUTDOWN] Sinal ${signal} recebido.`);
      const timeout = setTimeout(() => {
        app.log.error("Shutdown forçado por timeout.");
        process.exit(1);
      }, 15000);

      try {
        await app.close();
        clearTimeout(timeout);
        app.log.info("Servidor encerrado com sucesso.");
        process.exit(0);
      } catch (err) {
        app.log.error({ err }, "Erro durante o shutdown.");
        process.exit(1);
      }
    });
  });
}
