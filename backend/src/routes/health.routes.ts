import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import mongoose from "mongoose";
import { z } from "zod";

export async function healthRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/",
    {
      schema: {
        description: "Service health status",
        tags: ["System"],
        response: {
          200: z.object({
            status: z.literal("ok"),
            uptime: z.number(),
            timestamp: z.string(),
            service: z.string(),
            version: z.string(),
            dependencies: z.object({
              database: z.enum(["up", "down"]),
            }),
          }),
        },
      },
    },
    async (_request, reply) => {
      const isConnected = mongoose.connection.readyState === 1;

      return reply.status(200).send({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        service: "taverna-api",
        version: "1.0.0",
        dependencies: {
          database: isConnected ? "up" : "down",
        },
      });
    },
  );
}
