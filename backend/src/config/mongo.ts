import mongoose from "mongoose";
import logger from "../plugins/logger.js";
import { env } from "./env.js";

/**
 * Configuração de conexão com o MongoDB.
 * Em produção, deixamos o erro propagar para evitar que a API suba "morta".
 */
export const connectMongo = async (): Promise<void> => {
  // Configurações Globais
  mongoose.set("strictQuery", true);

  // Eventos de Monitoramento
  mongoose.connection.on("connected", () => logger.info("🍃 MongoDB: Online"));
  mongoose.connection.on("error", (err) =>
    logger.error({ err }, "❌ MongoDB: Erro"),
  );
  mongoose.connection.on("disconnected", () =>
    logger.warn("⚠️ MongoDB: Desconectado"),
  );

  const options: mongoose.ConnectOptions = {
    maxPoolSize: 10, // Mantém até 10 conexões abertas para reuso
    serverSelectionTimeoutMS: 5000,
    family: 4, // Força IPv4 (evita lentidão em alguns ambientes cloud)
    heartbeatFrequencyMS: 10000, // Checa a saúde da conexão a cada 10s
  };

  // Se já estiver conectado (evita múltiplas instâncias em Hot Reload)
  if (mongoose.connection.readyState === 1) return;

  // O operador ?? garante que se process.env.MONGO_URI existir, ele será usado.
  await mongoose.connect(process.env.MONGO_URI ?? env.MONGO_URI, options);
};
