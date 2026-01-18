import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fp from "fastify-plugin";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export const swaggerPlugin = fp(async (app) => {
  // 1. Configuração do Core do Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Taverna API - Sistema de Pedidos",
        description:
          "Documentação da API v1 com suporte a Idempotência e Roles",
        version: "1.0.0",
      },
      servers: [
        { url: "http://localhost:3333/api/v1", description: "Desenvolvimento" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    // Aqui acontece a mágica: converte Zod para JSON Schema automaticamente
    transform: jsonSchemaTransform,
  });

  // 2. Configuração da Interface Visual (UI)
  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
});
