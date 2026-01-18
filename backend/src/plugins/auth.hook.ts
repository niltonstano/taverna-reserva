import { FastifyReply, FastifyRequest } from "fastify";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // O jwtVerify decodifica o token e joga os dados em request.user
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ 
      message: "Acesso negado. Token inválido ou expirado." 
    });
  }
}