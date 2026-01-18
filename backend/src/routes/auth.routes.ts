import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthController } from "../controllers/auth.controller.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

export async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const controller = new AuthController();

  // Ajustado para refletir o que o Controller REALMENTE envia
  const loginResponse = {
    200: z.object({
      success: z.boolean(),
      token: z.string(),
      user: z.object({
        _id: z.any(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
      }),
    }),
  };

  const registerResponse = {
    201: z.object({
      success: z.boolean(),
      user: z.object({
        _id: z.any(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
      }),
    }),
  };

  // --- Rotas de Cliente ---
  typedApp.post(
    "/customer/register",
    {
      schema: {
        tags: ["Auth"],
        body: registerSchema,
        response: registerResponse,
      },
    },
    controller.customerRegister
  );

  typedApp.post(
    "/customer/login",
    {
      schema: { tags: ["Auth"], body: loginSchema, response: loginResponse },
      // ✅ Proteção contra força bruta: Máximo 5 tentativas por minuto
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    },
    controller.customerLogin
  );

  // --- Rotas de Admin ---
  typedApp.post(
    "/admin/register",
    {
      schema: {
        tags: ["Auth"],
        body: registerSchema,
        response: registerResponse,
      },
    },
    controller.adminRegister
  );

  typedApp.post(
    "/admin/login",
    {
      schema: { tags: ["Auth"], body: loginSchema, response: loginResponse },
      // ✅ Proteção rígida para o Painel Administrativo
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    },
    controller.adminLogin
  );
}
