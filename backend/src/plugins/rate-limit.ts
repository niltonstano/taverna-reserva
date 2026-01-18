import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";

export default fp(async (app) => {
  await app.register(rateLimit, {
    // 1. Proteção GLOBAL (mais folgada) para o site todo não cair
    global: true,
    max: 100,
    timeWindow: "1 minute",

    // 2. Configurações técnicas que você já tinha (corretas)
    cache: 5000,
    keyGenerator: (request) => {
      return (request.headers["x-forwarded-for"] as string) || request.ip;
    },

    // Resposta de erro personalizada
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: `Calma, sommelier! Muitas requisições. Tente novamente em ${context.after}.`,
    }),

    // 3. REGRAS ESPECÍFICAS (Aqui entra sua proteção de 5 tentativas)
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
  });
});
