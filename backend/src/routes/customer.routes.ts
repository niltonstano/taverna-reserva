import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authenticate, authorizeOwnership } from "../middlewares/authorization.js";
import { CustomerController } from "../controllers/customer.controller.js";
import { CustomerService } from "../services/customer.service.js";
import { CustomerRepository } from "../repositories/customer.repository.js";

export async function customerRoutes(app: FastifyInstance) {
  // Ativa o provedor de tipos Zod para esta instância de rotas
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  
  // Injeção de dependências
  const controller = new CustomerController(
    new CustomerService(new CustomerRepository())
  );

  /**
   * Rota: Perfil do Cliente
   */
  typedApp.get("/profile/:id", {
    schema: {
      tags: ["Customer"],
      summary: "Ver perfil do usuário",
      description: "Retorna os dados do perfil se o usuário for o dono da conta.",
      params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Formato de ID inválido (MongoDB ObjectId)")
      }),
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authenticate, authorizeOwnership]
  }, (req, res) => controller.getProfile(req, res)); // ✅ Resolvido aqui!

  /**
   * Rota: Logout
   */
  typedApp.post("/logout", {
    schema: { 
      tags: ["Customer"], 
      summary: "Logout do sistema",
      security: [{ bearerAuth: [] }] 
    },
    preHandler: [authenticate]
  }, (req, res) => controller.logout(req, res)); // ✅ Resolvido aqui!
}