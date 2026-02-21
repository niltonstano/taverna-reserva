import { FastifyInstance } from "fastify";
import { ProductController } from "../controllers/product.controller.js";
import {
  CreateProductRequest,
  IdOnlyRequest,
  ProductQuery,
  UpdateProductRequest,
} from "../interfaces/product.interface.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductService } from "../services/product.service.js";

/**
 * Product Module Routes
 * @description Define as rotas para o recurso de produtos, utilizando injeção de dependência manual.
 */
export async function productRoutes(fastify: FastifyInstance) {
  // --- Injeção de Dependências (Manual DI) ---
  const repository = new ProductRepository();
  const service = new ProductService(repository);
  const controller = new ProductController(service);

  // --- 🔓 ROTAS PÚBLICAS ---

  // GET /api/v1/products
  fastify.get<ProductQuery>("/", (req, rep) => controller.findAll(req, rep));

  // GET /api/v1/products/:id
  fastify.get<IdOnlyRequest>("/:id", (req, rep) =>
    controller.findOne(req, rep),
  );

  // --- 🔒 ROTAS PRIVADAS (Contexto Admin) ---
  // Encapsulamos em um plugin interno para futura aplicação de middlewares (hooks)
  fastify.register(async (admin) => {
    // Exemplo de uso futuro: admin.addHook('onRequest', fastify.authenticateAdmin);

    // POST /api/v1/products/
    admin.post<CreateProductRequest>("/", (req, rep) =>
      controller.create(req, rep),
    );

    // PUT /api/v1/products/:id
    admin.put<UpdateProductRequest>("/:id", (req, rep) =>
      controller.update(req, rep),
    );

    // DELETE /api/v1/products/:id
    admin.delete<IdOnlyRequest>("/:id", (req, rep) =>
      controller.delete(req, rep),
    );

    // PATCH /api/v1/products/:id/toggle-offer
    admin.patch<IdOnlyRequest>("/:id/toggle-offer", (req, rep) =>
      controller.toggleOffer(req, rep),
    );

    // POST /api/v1/products/seed
    admin.post("/seed", (req, rep) => controller.seed(req, rep));
  });

  fastify.log.info("📦 Product Module: Routes registered successfully.");
}
