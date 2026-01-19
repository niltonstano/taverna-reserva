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
      // 1. Permite requisições sem origin (como Postman, Mobile App ou Insomnia)
      // 2. Permite qualquer porta no localhost para facilitar o desenvolvimento
      if (!origin || /localhost/.test(origin) || /127\.0\.0\.1/.test(origin)) {
        cb(null, true);
        return;
      }

      // 3. Whitelist de Domínios de Produção
      const allowedOrigins = [
        "https://taverna-reserva.vercel.app",
        "https://seu-dominio-final.com.br", // Altere para seu domínio real
      ];

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }

      // 4. Bloqueia a requisição sem lançar erro de exceção no servidor (Silent Deny)
      cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
      "Accept",
      "Origin",
      "idempotency-key", // Essencial para operações de reserva seguras
    ],
    // Permite que o Frontend leia estes headers específicos na resposta
    exposedHeaders: ["x-request-id", "idempotency-key"],
    // Habilita envio de Cookies e Headers de Autorização
    credentials: true,
    // Tempo de cache para a resposta do Preflight (reduz requisições OPTIONS)
    maxAge: 86400,
  });
});
