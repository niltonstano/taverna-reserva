import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { CartController } from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/authorization.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { CartService } from "../services/cart.service.js";

const AddItemBodySchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID inválido"),
  quantity: z.number().int().positive(),
});

const ProductParamSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID inválido"),
});

export async function cartRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // Dependency Injection
  const cartRepository = new CartRepository();
  const productRepository = new ProductRepository();
  const cartService = new CartService(cartRepository, productRepository);
  const controller = new CartController(cartService);

  const baseSchema = {
    tags: ["Cart"],
    security: [{ bearerAuth: [] }],
  };

  // Definimos as rotas usando o typedApp diretamente
  typedApp.register(async (itemRoutes) => {
    itemRoutes.addHook("preHandler", authenticate);

    itemRoutes.get(
      "/",
      {
        schema: { ...baseSchema, summary: "Obter carrinho" },
      },
      controller.getCart,
    );

    itemRoutes.post(
      "/items",
      {
        schema: {
          ...baseSchema,
          summary: "Adicionar item",
          body: AddItemBodySchema,
        },
      },
      controller.addItem,
    );

    itemRoutes.delete(
      "/items/:productId",
      {
        schema: {
          ...baseSchema,
          summary: "Remover item",
          params: ProductParamSchema,
        },
      },
      controller.removeItem,
    );

    itemRoutes.delete(
      "/clear",
      {
        schema: { ...baseSchema, summary: "Limpar carrinho" },
      },
      controller.clearCart,
    );
  });
}
