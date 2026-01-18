import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import mongoose from "mongoose";
import { z } from "zod";

// Controllers
import { OrderController } from "../controllers/order.controller.js";

// Middlewares de Segurança
import {
  authenticate,
  UserRole,
  verifyRole,
} from "../middlewares/authorization.js";

// Repositories e Services
import { CartRepository } from "../repositories/cart.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { CheckoutService } from "../services/checkout.service.js";
import { OrderService } from "../services/order.service.js";

/** * 📝 SCHEMAS DE RESPOSTA (Ajustados para evitar ResponseSerializationError)
 */

const OrderItemSchema = z.object({
  // ✅ Coerce garante que ObjectIds do Mongo virem string na saída
  productId: z.coerce.string(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  subtotal: z.number(),
});

const OrderSchema = z.object({
  // ✅ Forçamos a conversão de todos os IDs e Datas
  _id: z.coerce.string(),
  userId: z.coerce.string(),
  items: z.array(OrderItemSchema),
  totalPrice: z.number(),
  status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]),
  idempotencyKey: z.string().optional().nullable(),
  createdAt: z
    .any()
    .transform((val) => (val instanceof Date ? val.toISOString() : val))
    .optional(),
});

const PaymentDataSchema = z.object({
  qr_code: z.string(),
  qr_code_base64: z.string(),
  ticket_url: z.string(),
  payment_id: z.number(),
});

export async function orderRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  /** 🏗️ INJEÇÃO DE DEPENDÊNCIAS */
  const orderRepo = new OrderRepository();
  const productRepo = new ProductRepository();
  const cartRepo = new CartRepository();

  const orderService = new OrderService(orderRepo, productRepo);
  const checkoutService = new CheckoutService(
    orderRepo,
    cartRepo,
    productRepo,
    mongoose.connection
  );

  const orderController = new OrderController(orderService, checkoutService);

  /** 🛡️ SEGURANÇA GLOBAL */
  typedApp.addHook("onRequest", authenticate);

  // --- ROTAS DO CLIENTE (SHOPPER) ---

  /** 🛒 CHECKOUT */
  typedApp.post(
    "/checkout",
    {
      schema: {
        tags: ["Shop | Checkout"],
        summary: "Processa o checkout com validação rigorosa",
        headers: z.object({
          "idempotency-key": z.string().uuid(),
        }),
        response: {
          201: z.object({
            success: z.boolean(),
            order: OrderSchema,
            payment_data: PaymentDataSchema,
          }),
        },
      },
    },
    async (req, res) => {
      return orderController.checkout(req as any, res);
    }
  );

  /** 📦 MEUS PEDIDOS */
  typedApp.get(
    "/my-orders",
    {
      schema: {
        tags: ["Member | Dashboard"],
        summary: "Lista histórico de pedidos",
        response: {
          200: z.object({
            success: z.boolean(),
            data: z.array(OrderSchema),
          }),
        },
      },
    },
    async (req, res) => {
      return orderController.listMyOrders(req as any, res);
    }
  );

  // --- ROTAS ADMINISTRATIVAS (ADMIN ONLY) ---

  /** 📋 LISTAR TODOS */
  typedApp.get(
    "/",
    {
      preHandler: [verifyRole([UserRole.ADMIN])],
      schema: {
        tags: ["Admin | Pedidos"],
        summary: "Lista todos os pedidos (Admin)",
        querystring: z.object({
          page: z.coerce.number().min(1).default(1),
          limit: z.coerce.number().min(1).max(100).default(10),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            data: z.array(OrderSchema),
          }),
        },
      },
    },
    async (req, res) => {
      return orderController.findAll(req as any, res);
    }
  );

  /** ⚙️ ATUALIZAR STATUS */
  typedApp.patch(
    "/:id/status",
    {
      preHandler: [verifyRole([UserRole.ADMIN])],
      schema: {
        tags: ["Admin | Pedidos"],
        summary: "Atualiza o status logístico",
        params: z.object({
          id: z.string().length(24),
        }),
        body: z.object({
          status: z.enum([
            "pending",
            "paid",
            "shipped",
            "delivered",
            "cancelled",
          ]),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OrderSchema,
          }),
        },
      },
    },
    async (req, res) => {
      return orderController.updateStatus(req as any, res);
    }
  );
}
