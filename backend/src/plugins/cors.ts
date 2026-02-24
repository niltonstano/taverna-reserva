import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    // Em desenvolvimento, origin: true é o mais seguro para evitar Network Error
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
      "Accept",
      "Origin",
    ],
    credentials: true,
    maxAge: 86400,
  });
});
