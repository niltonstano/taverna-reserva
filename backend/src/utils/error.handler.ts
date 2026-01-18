import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Erros de Validação (Zod ou Validação nativa do Fastify)
  // Adicionamos 'error.name === "ZodError"' para maior segurança nos testes
  if (error instanceof ZodError || error.name === "ZodError" || error.validation) {
    return reply.status(400).send({
      success: false,
      message: "Erro de validação nos dados enviados.",
      errors: error instanceof ZodError ? error.flatten().fieldErrors : error.validation
    });
  }

  // 2. Erros de Autenticação/Autorização
  if (error.statusCode === 401 || error.statusCode === 403) {
    return reply.status(error.statusCode).send({
      success: false,
      message: error.message || "Acesso negado."
    });
  }

  // 3. Database Timeout (Prevenção)
  if (error.message.includes("buffering timed out") || error.code === 'ETIMEDOUT') {
    return reply.status(503).send({
      success: false,
      message: "Serviço instável. Tente novamente em instantes."
    });
  }

  // 4. Log para o servidor
  request.log.error(error);

  // 5. Fallback Final
  return reply.status(error.statusCode || 500).send({
    success: false,
    message: isProd ? "Erro interno no servidor" : error.message,
    code: error.code || "INTERNAL_ERROR"
  });
};