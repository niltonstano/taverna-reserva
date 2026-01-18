import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin || /localhost/.test(origin)) {
        cb(null, true);
        return;
      }

      const allowedOrigins = [
        "https://taverna-reserva.vercel.app",
        "https://seu-dominio-final.com.br",
      ];

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }

      cb(new Error("Not allowed by CORS"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
      "Accept",
      "Origin",
      "idempotency-key", // 🔥 LIBERADO: Agora o front pode enviar
    ],
    exposedHeaders: ["x-request-id", "idempotency-key"], // Opcional: permite o front ler o header na resposta
    credentials: true,
  });
});
