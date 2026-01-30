import { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";
import logger from "./plugins/logger.js";

// --- 🛡️ SEGURANÇA DE PROCESSO (ANTI-CRASH SILENCIOSO) ---
process.on("unhandledRejection", (reason) => {
  logger.fatal(
    { err: reason },
    "❌ Rejeição não tratada. Encerrando processo.",
  );
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "❌ EXCEÇÃO FATAL! Encerrando processo.");
  process.exit(1);
});

/**
 * START: Inicialização oficial do Servidor
 */
const start = async (): Promise<void> => {
  let app: FastifyInstance | undefined;

  try {
    // 1️⃣ Conecta ao Mongo ANTES de qualquer coisa
    await connectMongo();

    // 2️⃣ Só carrega eventos depois do banco estar online
    await import("./events/index.js");

    // 3️⃣ Instancia o Fastify (plugins, segurança, rotas, etc.)
    app = await buildApp();

    // 4️⃣ Configuração de rede (compatível com Docker e Cloud)
    const port = Number(env.PORT) || 3333;
    const host = "0.0.0.0";

    const address = await app.listen({ port, host });

    logger.info({
      msg: "🚀 TAVERNA ONLINE",
      url: address,
      mode: env.NODE_ENV,
      database: "MongoDB connected",
      pid: process.pid,
    });

    // --- 🛑 DESLIGAMENTO GRACIOSO (GRACEFUL SHUTDOWN) ---
    const closeGracefully = async (signal: string) => {
      logger.warn(`🛑 Sinal [${signal}] recebido. Iniciando encerramento...`);

      const forceExit = setTimeout(() => {
        logger.fatal("❌ Timeout no shutdown. Forçando encerramento.");
        process.exit(1);
      }, 10000);

      try {
        if (app) {
          // Para de aceitar novas conexões
          app.server.closeIdleConnections?.();
          await app.close();
        }

        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }

        clearTimeout(forceExit);
        logger.info("✅ Sistema desligado com segurança.");
        process.exit(0);
      } catch (err) {
        logger.fatal({ err }, "❌ Erro durante shutdown forçado.");
        process.exit(1);
      }
    };

    process.on("SIGINT", () => closeGracefully("SIGINT"));
    process.on("SIGTERM", () => closeGracefully("SIGTERM"));
  } catch (err) {
    logger.fatal({ err }, "❌ Falha crítica no startup do servidor");
    process.exit(1);
  }
};

start();
