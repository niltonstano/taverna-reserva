import mongoose from "mongoose";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";
import "./events/index.js";
import logger from "./plugins/logger.js";

// --- 🛡️ SEGURANÇA DE PROCESSO ---
// Captura erros fora de blocos try/catch ou promessas perdidas
process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ err: reason }, "❌ Rejeição não tratada detectada.");
});

process.on("uncaughtException", (err: Error) => {
  logger.fatal(
    { err },
    "❌ EXCEÇÃO FATAL! Encerrando processo para evitar estado inconsistente."
  );
  // Em produção, um gerenciador de processos (PM2/K8s) reiniciará o app limpo.
  process.exit(1);
});

const start = async (): Promise<void> => {
  try {
    // 1. Conecta ao Banco ANTES de subir o app
    await connectMongo();
    logger.info("📡 Conexão com MongoDB estabelecida.");

    // 2. Instancia o Fastify
    const app = await buildApp();

    const port = env.PORT || 3333;
    const host = "0.0.0.0";

    // 3. Inicia o servidor
    const address = await app.listen({ port, host: "0.0.0.0" });

    const mode = process.env.NODE_ENV || "development";
    logger.warn(`🚀 Backend ONLINE em ${address} | Mode: ${mode}`);

    // --- 🛑 DESLIGAMENTO GRACIOSO (Graceful Shutdown) ---
    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

    for (const signal of signals) {
      process.on(signal, async () => {
        logger.warn(
          `🛑 Sinal [${signal}] recebido. Iniciando encerramento seguro...`
        );

        // Timeout de segurança para o fechamento (máximo 10s)
        const forceExit = setTimeout(() => {
          logger.fatal(
            "❌ Falha ao fechar recursos a tempo. Forçando encerramento."
          );
          process.exit(1);
        }, 10000);

        try {
          // 1. Para de aceitar novas requisições HTTP
          await app.close();
          logger.info("🔌 Servidor Fastify encerrado.");

          // 2. Fecha conexão com o Banco de Dados
          if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            logger.info("🗄️ MongoDB desconectado.");
          }

          clearTimeout(forceExit);
          logger.warn("✅ Sistema offline com segurança. Até logo!");
          process.exit(0);
        } catch (err) {
          logger.error({ err }, "❌ Erro durante o desligamento");
          process.exit(1);
        }
      });
    }
  } catch (err) {
    logger.fatal({ err }, "❌ Falha crítica no startup do servidor");
    process.exit(1);
  }
};

// Execução segura com tratamento de erro na raiz
void start().catch((err) => {
  logger.fatal({ err }, "❌ Erro catastrófico na inicialização");
  process.exit(1);
});
