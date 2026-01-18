import { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export async function healthRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get("/health", {
    schema: {
      description: "Verifica a saúde do sistema",
      tags: ["System"],
      response: {
        200: z.object({
          success: z.boolean(),
          status: z.string(),
          database: z.string(),
          uptime: z.number(),
          timestamp: z.string(),
          version: z.string()
        })
      }
    }
  }, async (_request, reply) => {
    const isConnected = mongoose.connection.readyState === 1;
    return reply.send({
      success: isConnected,
      status: "API is operational",
      database: isConnected ? "connected" : "disconnected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });
}