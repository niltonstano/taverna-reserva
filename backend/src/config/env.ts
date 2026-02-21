import dotenv from "dotenv";
import { z } from "zod";
import logger from "../plugins/logger.js";

dotenv.config();

const MONGO_URI_REGEX = /^mongodb(\+srv)?:\/\/.+$/;

const rawEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().min(1).default("0.0.0.0"),
  LOG_LEVEL: z.enum(["info", "debug", "warn", "error"]).default("info"),
  JWT_SECRET: z.string().min(32),
  MONGO_URI: z.string().regex(MONGO_URI_REGEX),
  CORS_ORIGIN: z.string().default("*"),
  INITIAL_ADMIN_EMAIL: z.string().email(),
  INITIAL_ADMIN_PASSWORD: z.string().min(8),

  // ✅ NOME REAL DO .ENV
  MELHOR_ENVIO_TOKEN: z.string().min(1),
  MELHOR_ENVIO_URL: z.string().url(),
});

const parsed = rawEnvSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error(
    { errors: parsed.error.flatten().fieldErrors },
    "❌ Variáveis de ambiente inválidas",
  );
  process.exit(1);
}

const raw = parsed.data;

/**
 * 🎯 Aqui convertemos para camelCase
 * O resto da aplicação NÃO usa nomes em UPPERCASE
 */
export const env = Object.freeze({
  NODE_ENV: raw.NODE_ENV,
  PORT: raw.PORT,
  HOST: raw.HOST,
  LOG_LEVEL: raw.LOG_LEVEL,
  JWT_SECRET: raw.JWT_SECRET,
  MONGO_URI: raw.MONGO_URI,
  CORS_ORIGIN: raw.CORS_ORIGIN,
  INITIAL_ADMIN_EMAIL: raw.INITIAL_ADMIN_EMAIL,
  INITIAL_ADMIN_PASSWORD: raw.INITIAL_ADMIN_PASSWORD,

  melhorEnvioToken: raw.MELHOR_ENVIO_TOKEN,
  melhorEnvioBaseUrl: raw.MELHOR_ENVIO_URL,
});

export type Env = typeof env;
