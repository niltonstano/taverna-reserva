import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { CartController } from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/authorization.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { CartService } from "../services/cart.service.js";

// --- Schemas e Tipos Exportados ---
export const AddItemBodySchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de produto inválido"),
  quantity: z.number().int().positive("A quantidade deve ser superior a zero"),
});
export type AddItemBody = z.infer<typeof AddItemBodySchema>;

export const RemoveItemParamsSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de produto inválido"),
});
export type RemoveItemParams = z.infer<typeof RemoveItemParamsSchema>;

const CartItemSchema = z.object({
  productId: z.union([
    z.string().regex(/^[0-9a-fA-F]{24}$/),
    z.object({}).passthrough(),
  ]),
  quantity: z.number().int().positive(),
});

const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function cartRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const controller = new CartController(
    new CartService(new CartRepository(), new ProductRepository())
  );

  const cartTag = { tags: ["Cart"] };
  const security = { security: [{ bearerAuth: [] }] };

  typedApp.get(
    "/",
    {
      schema: { ...cartTag, ...security, summary: "Visualizar carrinho" },
      preHandler: [authenticate],
    },
    async (req, res) => controller.getCart(req as never, res)
  );

  typedApp.post(
    "/items",
    {
      schema: {
        ...cartTag,
        ...security,
        body: AddItemBodySchema,
        summary: "Adicionar produto",
      },
      preHandler: [authenticate],
    },
    async (req, res) => controller.addItem(req as never, res)
  );

  typedApp.delete(
    "/items/:productId",
    {
      schema: {
        ...cartTag,
        ...security,
        params: RemoveItemParamsSchema,
        summary: "Remover produto",
      },
      preHandler: [authenticate],
    },
    async (req, res) => controller.removeItem(req as never, res)
  );

  typedApp.delete(
    "/clear",
    {
      schema: { ...cartTag, ...security, summary: "Esvaziar carrinho" },
      preHandler: [authenticate],
    },
    async (req, res) => controller.clearCart(req as never, res)
  );
}
