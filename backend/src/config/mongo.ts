import mongoose from "mongoose";
import logger from "../plugins/logger.js";
import { withRetry } from "../utils/resilience.js";
import { env } from "./env.js";

export const connectMongo = async (): Promise<void> => {
  mongoose.set("strictQuery", true);

  // Eventos de Monitoramento (Passivos)
  mongoose.connection.on("connected", () => logger.info("🍃 MongoDB: Online"));
  mongoose.connection.on("error", (err) =>
    logger.error({ err }, "❌ MongoDB: Erro"),
  );
  mongoose.connection.on("disconnected", () =>
    logger.warn("⚠️ MongoDB: Desconectado"),
  );

  if (mongoose.connection.readyState === 1) return;

  const options: mongoose.ConnectOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    family: 4,
  };

  const uri = process.env.MONGO_URI ?? env.MONGO_URI;

  // Delega a responsabilidade do erro e das tentativas para o utilitário
  await withRetry(() => mongoose.connect(uri, options));
};
