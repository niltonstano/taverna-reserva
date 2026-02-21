import mongoose from "mongoose";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";
import { initEvents } from "./events/index.js";
import logger from "./plugins/logger.js";

/**
 * 🚀 INICIALIZAÇÃO DO SISTEMA
 */
const start = async () => {
  try {
    // 1. Inicializa Listeners de Eventos (E-mail, Logística, etc.)
    initEvents();

    // 2. Conecta ao Banco de Dados
    await connectMongo();

    // 3. Constrói a instância do Fastify (Plugins, Rotas, ErrorHandler)
    const server = await buildApp();

    const port = Number(env.PORT) || 3333;
    const host = "0.0.0.0";

    const address = await server.listen({ port, host });

    logger.info({
      msg: "🚀 TAVERNA ONLINE",
      url: address,
      mode: env.NODE_ENV,
      pid: process.pid,
    });

    // 🛑 GRACEFUL SHUTDOWN (Encerramento Seguro)
    const signals = ["SIGINT", "SIGTERM"] as const;

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.warn(`🛑 Sinal [${signal}] recebido. Encerrando...`);

        await server.close();
        await mongoose.disconnect();

        logger.info("✅ Sistema desligado com segurança. 👋");
        process.exit(0);
      });
    });
  } catch (err) {
    logger.fatal({ err }, "❌ Falha crítica no startup");
    process.exit(1);
  }
};

// Captura erros globais que escaparem de qualquer lógica
process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "❌ Rejeição não tratada detectada");
  process.exit(1);
});

start();
