import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { CustomerController } from "../controllers/customer.controller.js";
import {
  adminOnly,
  authenticate,
  authorizeOwnership,
} from "../middlewares/authorization.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { CustomerService } from "../services/customer.service.js";

export async function customerRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // Injeção de dependência manual (Padrão Clean Architecture)
  const controller = new CustomerController(
    new CustomerService(new CustomerRepository()),
  );

  /**
   * ✅ GET /api/v1/customer/
   * Lista simplificada para o Dashboard Admin (findAllNoPagination)
   */
  typedApp.get(
    "/",
    {
      schema: {
        summary: "Lista todos os clientes (Admin only)",
        tags: ["Customer"],
        security: [{ bearerAuth: [] }],
        // O response deve aceitar o que o listAll envia (geralmente o array direto)
      },
      preHandler: [authenticate, adminOnly],
    },
    async (req, res) => controller.listAll(req, res),
  );

  /**
   * ✅ GET /api/v1/customer/all
   * Lista paginada para o Dashboard com metadados
   */
  typedApp.get(
    "/all",
    {
      schema: {
        summary: "Lista paginada de clientes",
        tags: ["Customer"],
        querystring: z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(20),
        }),
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate, adminOnly],
    },
    async (req, res) => controller.getAll(req, res),
  );

  /**
   * ✅ GET /api/v1/customer/profile/:id
   */
  typedApp.get(
    "/profile/:id",
    {
      schema: {
        tags: ["Customer"],
        params: z.object({
          id: z.string().length(24, "ID do MongoDB inválido"),
        }),
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate, authorizeOwnership],
    },
    async (req, res) => controller.getProfile(req, res),
  );

  /**
   * ✅ DELETE /api/v1/customer/:id
   */
  typedApp.delete(
    "/:id",
    {
      schema: {
        summary: "Deletar cliente",
        tags: ["Customer"],
        params: z.object({
          id: z.string().length(24, "ID inválido"),
        }),
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate, adminOnly],
    },
    async (req, res) => controller.delete(req, res),
  );

  /**
   * ✅ POST /api/v1/customer/logout
   */
  typedApp.post(
    "/logout",
    {
      schema: { tags: ["Customer"], security: [{ bearerAuth: [] }] },
      preHandler: [authenticate],
    },
    async (req, res) => controller.logout(req, res),
  );
}
