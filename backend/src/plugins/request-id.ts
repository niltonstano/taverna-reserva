import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { randomUUID } from "crypto";

export default fp(async (fastify: FastifyInstance) => {
  fastify.addHook("onRequest", async (request, reply) => {
    // Se o cliente não enviar um ID, nós geramos um
    const requestId = request.headers["x-request-id"] || randomUUID();
    request.headers["x-request-id"] = requestId;
    
    // Injetamos o logger com o ID da requisição embutido
    request.log = request.log.child({ requestId });
  });
});