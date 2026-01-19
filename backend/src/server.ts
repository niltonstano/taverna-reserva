import { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";
import "./events/index.js";
import logger from "./plugins/logger.js";

// --- 🛡️ SEGURANÇA DE PROCESSO ---
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "❌ Rejeição não tratada detectada.");
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
    // 1. Conecta ao Banco (Essencial antes de subir a API)
    await connectMongo();

    // 2. Instancia o Fastify (Já com CORS, Helmet e envPlugin)
    app = await buildApp();

    // 3. Configuração de Rede
    // No Docker, a PORT interna é 3333 e o HOST deve ser 0.0.0.0
    const port = Number(env.PORT) || 3333;
    const host = "0.0.0.0";

    // O await app.listen é o que "abre as portas" do container para o mundo
    const address = await app.listen({
      port: 3333,
      host: "0.0.0.0",
    });

    logger.info({
      msg: "🚀 TAVERNA ONLINE",
      url: address,
      mode: env.NODE_ENV,
      database: "MongoDB connected",
    });

    // --- 🛑 DESLIGAMENTO GRACIOSO ---
    const closeGracefully = async (signal: string) => {
      logger.warn(`🛑 Sinal [${signal}] recebido. Iniciando encerramento...`);

      const forceExit = setTimeout(() => {
        logger.fatal("❌ Timeout: Forçando encerramento imediato.");
        process.exit(1);
      }, 10000);

      if (app) await app.close();
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect();

      clearTimeout(forceExit);
      logger.info("✅ Sistema desligado com segurança.");
      process.exit(0);
    };

    process.on("SIGINT", () => closeGracefully("SIGINT"));
    process.on("SIGTERM", () => closeGracefully("SIGTERM"));
  } catch (err) {
    logger.fatal({ err }, "❌ Falha crítica no startup do servidor");
    process.exit(1);
  }
};

start();
