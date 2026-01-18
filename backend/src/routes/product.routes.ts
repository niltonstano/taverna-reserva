import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ProductController } from "../controllers/product.controller.js";
import { adminOnly, authenticate } from "../middlewares/authorization.js"; // 🛡️ Importado do seu middleware novo
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductService } from "../services/product.service.js";

// Importamos os schemas e os tipos inferidos
import {
  listProductsResponseSchema,
  productIdSchema,
  productQuerySchema,
  productResponseSchema,
  productSchema,
} from "../schemas/product.schema.js";

import {
  ProductInput,
  ProductParams,
  ProductQuery,
} from "../controllers/product.controller.js";

export async function productRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  const repository = new ProductRepository();
  const service = new ProductService(repository);
  const controller = new ProductController(service);

  const baseSecurity = { security: [{ bearerAuth: [] }] };

  // --- 🌍 Rotas Públicas (Qualquer um acessa) ---

  typedApp.get<{ Querystring: ProductQuery }>(
    "/",
    {
      schema: {
        tags: ["Products"],
        summary: "Listar produtos com paginação",
        querystring: productQuerySchema,
        response: { 200: listProductsResponseSchema },
      },
    },
    controller.findAll
  );

  typedApp.get<{ Params: ProductParams }>(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        summary: "Obter detalhes de um produto",
        params: productIdSchema,
        response: { 200: productResponseSchema },
      },
    },
    controller.findOne
  );

  // --- 🔐 Rotas Protegidas (Apenas ADMIN logado) ---

  // Rota de Seed protegida para não resetarem seu banco na produção
  typedApp.get(
    "/seed-agora",
    {
      schema: {
        tags: ["System"],
        summary: "Popular banco de dados (Admin Only)",
        ...baseSecurity,
      },
      preHandler: [authenticate, adminOnly],
    },
    controller.seed
  );

  typedApp.post<{ Body: ProductInput }>(
    "/",
    {
      schema: {
        tags: ["Products"],
        summary: "Criar novo produto",
        ...baseSecurity,
        body: productSchema,
        response: { 201: productResponseSchema },
      },
      preHandler: [authenticate, adminOnly],
    },
    controller.create
  );

  typedApp.put<{ Params: ProductParams; Body: Partial<ProductInput> }>(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        summary: "Atualizar produto existente",
        ...baseSecurity,
        params: productIdSchema,
        body: productSchema.partial(),
        response: { 200: productResponseSchema },
      },
      preHandler: [authenticate, adminOnly],
    },
    controller.update
  );

  typedApp.delete<{ Params: ProductParams }>(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        summary: "Remover produto",
        ...baseSecurity,
        params: productIdSchema,
        response: {
          200: z.object({ success: z.boolean(), message: z.string() }),
        },
      },
      preHandler: [authenticate, adminOnly],
    },
    controller.delete
  );
}
