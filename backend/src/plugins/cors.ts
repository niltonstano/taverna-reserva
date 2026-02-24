import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

/**
 * Plugin de CORS: Configurado para aceitar múltiplas origens
 * e headers customizados necessários para a Taverna Reserva.
 */
export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // 1. Permite requisições sem origin (como Postman ou chamadas diretas do Servidor)
      // 2. Permite localhost em qualquer porta (essencial para Docker e Dev)
      if (!origin || /localhost/.test(origin) || /127\.0\.0\.1/.test(origin)) {
        cb(null, true);
        return;
      }

      // 3. Whitelist de Domínios de Produção
      const allowedOrigins = [
        "https://taverna-reserva.vercel.app",
        "https://seu-dominio-final.com.br",
      ];

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }

      // 4. Bloqueia a requisição (Silent Deny)
      cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
      "Accept",
      "Origin",
      "idempotency-key",
    ],
    exposedHeaders: ["x-request-id", "idempotency-key"],
    credentials: true,
    maxAge: 86400,
  });
});
