import dotenv from "dotenv";
import { z } from "zod";
import logger from "../plugins/logger.js";

dotenv.config();

const MONGO_URI_REGEX = /^mongodb(\+srv)?:\/\/.+$/;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().min(1).default("0.0.0.0"),
  LOG_LEVEL: z.enum(["info", "debug", "warn", "error"]).default("info"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter no mínimo 32 caracteres"),
  MONGO_URI: z
    .string()
    .regex(MONGO_URI_REGEX, "Formato de URI MongoDB inválido"),
  CORS_ORIGIN: z.string().min(1).default("*"),
  INITIAL_ADMIN_EMAIL: z.string().email(),
  INITIAL_ADMIN_PASSWORD: z.string().min(8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  logger.error({ errors }, "❌ Variáveis de ambiente inválidas");
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
