import fp from "fastify-plugin";
import { env } from "../config/env.js"; // ✅ Adicionado .js para compatibilidade com NodeNext/ESM

/**
 * Este plugin decora a instância do Fastify com as variáveis de ambiente.
 * Isso permite acessar 'app.env' em qualquer lugar do servidor.
 */
export default fp(async (app) => {
  app.decorate("env", env);
});