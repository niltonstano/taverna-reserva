import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthController } from "../controllers/auth.controller.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

export async function authRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const controller = new AuthController();

  /**
   * ✅ Schema de Resposta de Usuário
   * Nota: No Controller usamos 'id', então aqui deve ser 'id'.
   * Adicionamos campos de data para bater com o PublicUserDTO.
   */
  const userResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["admin", "customer"]),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
  });

  const authSuccessResponse = {
    200: z.object({
      token: z.string(),
      user: userResponseSchema,
    }),
  };

  const registerSuccessResponse = {
    201: z.object({
      success: z.boolean(),
      user: userResponseSchema,
    }),
  };

  // --- Rotas de Cliente ---
  typedApp.post(
    "/customer/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Registro de novo cliente",
        body: registerSchema,
        response: registerSuccessResponse,
      },
    },
    controller.customerRegister,
  );

  typedApp.post(
    "/customer/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login de cliente",
        body: loginSchema,
        response: authSuccessResponse,
      },
      // ✅ Rate Limit para evitar Brute Force
      config: {
        rateLimit: { max: 5, timeWindow: "1 minute" },
      },
    },
    controller.customerLogin,
  );

  // --- Rotas de Admin ---
  typedApp.post(
    "/admin/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Registro de novo administrador",
        body: registerSchema,
        response: registerSuccessResponse,
      },
    },
    controller.adminRegister,
  );

  typedApp.post(
    "/admin/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login administrativo",
        body: loginSchema,
        response: authSuccessResponse,
      },
      config: {
        rateLimit: { max: 5, timeWindow: "1 minute" },
      },
    },
    controller.adminLogin,
  );
}
