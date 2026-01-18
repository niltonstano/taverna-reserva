import mongoose from "mongoose";
import logger from "../plugins/logger.js";
import { env } from "./env.js";

export const connectMongo = async (): Promise<void> => {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => logger.info("🍃 MongoDB: Online"));
  mongoose.connection.on("error", (err) =>
    logger.error({ err }, "❌ MongoDB: Erro")
  );

  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      family: 4,
    };

    await mongoose.connect(env.MONGO_URI, options);
  } catch (err) {
    logger.fatal({ err }, "❌ MongoDB: Falha fatal");
    process.exit(1);
  }
};
