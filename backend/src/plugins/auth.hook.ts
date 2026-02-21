import { FastifyReply, FastifyRequest } from "fastify";

/**
 * 🔐 Middleware de Autenticação
 * Delegamos o tratamento de erro para o Error Handler Global.
 * O '_' antes de reply indica ao TypeScript que o parâmetro é aceito pela
 * assinatura do Fastify, mas não será usado aqui.
 */
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  await request.jwtVerify();
}
