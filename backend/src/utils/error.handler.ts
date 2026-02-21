import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "./errors.js";

/**
 * 🛡️ Global Error Handler
 * Centraliza a inteligência de resposta, logs e segurança.
 */
export const errorHandler = (
  error: any, // Usamos any para capturar erros de diversas libs (Mongo, Zod, JWT)
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const isProd = process.env.NODE_ENV === "production";

  // --- 1. ERROS DE BANCO DE DADOS (MongoDB/Mongoose) ---

  // Chave Duplicada (Ex: E-mail já cadastrado)
  if (error.code === 11000) {
    return reply.status(409).send({
      success: false,
      code: "CONFLICT_ERROR",
      message: "Este registro (e-mail ou documento) já existe no sistema.",
    });
  }

  // Erros de Conexão/Timeout
  if (
    error.message?.includes("buffering timed out") ||
    error.code === "ETIMEDOUT" ||
    error.name === "MongooseServerSelectionError"
  ) {
    request.log.fatal({ err: error.message }, "DATABASE_OFFLINE");
    return reply.status(503).send({
      success: false,
      code: "SERVICE_UNAVAILABLE",
      message:
        "O banco de dados está temporariamente indisponível. Tente em instantes.",
    });
  }

  // --- 2. ERROS DE VALIDAÇÃO (Zod & Fastify) ---

  // Zod puro (Parsing manual em Controllers ou Services)
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Dados de entrada inválidos.",
      errors: error.flatten().fieldErrors,
    });
  }

  // Validação Nativa do Fastify (Zod Type Provider)
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      code: "FST_VALIDATION_ERROR",
      message: "Falha na validação dos campos enviados.",
      details: error.validation.map((v: any) => ({
        path: v.instancePath || v.params?.missingProperty || "field",
        message: v.message,
      })),
    });
  }

  // --- 3. ERROS DE NEGÓCIO (AppError Personalizado) ---

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      code: error.code || "OPERATION_ERROR",
      message: error.message,
    });
  }

  // --- 4. ERROS DE AUTENTICAÇÃO E AUTORIZAÇÃO ---

  if (error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED") {
    return reply.status(401).send({
      success: false,
      code: "TOKEN_EXPIRED",
      message: "Sua sessão expirou. Por favor, faça login novamente.",
    });
  }

  if (
    error.statusCode === 401 ||
    error.statusCode === 403 ||
    error.code === "FST_JWT_NO_AUTHORIZATION_TOKEN_HAS_BEEN_PASSED"
  ) {
    return reply.status(error.statusCode || 401).send({
      success: false,
      code: error.statusCode === 403 ? "FORBIDDEN" : "UNAUTHORIZED",
      message: error.message || "Acesso negado. Autenticação necessária.",
    });
  }

  // --- 5. LOG E FALLBACK (Erro 500) ---

  // Registra o erro real no log do servidor (Pino)
  request.log.error({
    err: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    context: {
      url: request.url,
      method: request.method,
      requestId: request.id,
    },
  });

  const statusCode = error.statusCode || 500;

  return reply.status(statusCode).send({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: isProd
      ? "Ocorreu um erro interno inesperado. Nossa equipe já foi notificada."
      : error.message,
    // Stack trace apenas em ambiente de desenvolvimento
    ...(!isProd && { stack: error.stack }),
  });
};
