import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import mongoose from "mongoose";
import { z } from "zod";

// Controllers, Schemas e Middlewares
import { OrderController } from "../controllers/order.controller.js";
import {
  authenticate,
  UserRole,
  verifyRole,
} from "../middlewares/authorization.js";
import { createOrderSchema } from "../schemas/order.schema.js";

// Repositories e Services
import { CartRepository } from "../repositories/cart.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { CheckoutService } from "../services/checkout.service.js";
import { OrderService } from "../services/order.service.js";

// --- 📝 SCHEMAS DE RESPOSTA (Contratos Atômicos) ---

const OrderResponseSchema = z
  .object({
    _id: z.any().transform(String),
    userId: z.any().transform(String),
    customerEmail: z.string(),
    items: z.array(
      z.object({
        productId: z.string(),
        name: z.string(),
        quantity: z.number(),
        priceCents: z.number(),
        subtotalCents: z.number(),
      }),
    ),
    totalPriceCents: z.number(),
    shippingPriceCents: z.number(),
    status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]),
    address: z.string(),
    zipCode: z.string(),
    createdAt: z
      .any()
      .transform((v) => (v instanceof Date ? v.toISOString() : String(v))),
  })
  .passthrough();

const PaymentDataSchema = z.object({
  qr_code: z.string().optional(),
  payment_url: z.string().optional(),
  payment_id: z.any().optional(),
});

// --- 🛣️ DEFINIÇÃO DAS ROTAS ---

export async function orderRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  /** 🏗️ INJEÇÃO DE DEPENDÊNCIAS (Composition Root) */
  const orderRepo = new OrderRepository();
  const productRepo = new ProductRepository();
  const cartRepo = new CartRepository();
  const connection = mongoose.connection;

  const whatsappProvider = {
    generatePaymentLink: (
      orderId: string,
      totalCents: number,
      email: string,
    ) => {
      const totalDisplay = (totalCents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      const text = encodeURIComponent(
        `🍷 *Taverna do Vinho*\n\nConfirmação de Pedido:\n🆔 *ID:* ${orderId}\n💰 *Total:* ${totalDisplay}\n📧 *Email:* ${email}`,
      );
      return `https://wa.me/5511999999999?text=${text}`;
    },
  };

  const orderService = new OrderService(orderRepo, productRepo, connection);
  const checkoutService = new CheckoutService(
    orderRepo,
    cartRepo,
    productRepo,
    whatsappProvider,
    connection,
  );
  const orderController = new OrderController(orderService, checkoutService);

  /** 🛡️ SEGURANÇA: Hook Global */
  typedApp.addHook("onRequest", authenticate);

  // --- 🛒 ROTAS DE CLIENTE ---

  typedApp.post(
    "/checkout",
    {
      schema: {
        summary: "Finaliza pedido e gera link de pagamento",
        tags: ["Shop | Checkout"],
        headers: z.object({ "idempotency-key": z.string().uuid() }),
        body: createOrderSchema,
        response: {
          201: z.object({
            success: z.boolean(),
            message: z.string(),
            order: OrderResponseSchema,
            payment_data: PaymentDataSchema,
          }),
        },
      },
    },
    (req, res) => orderController.checkout(req as any, res),
  );

  typedApp.get(
    "/my-orders",
    {
      schema: {
        summary: "Lista pedidos do usuário logado",
        tags: ["Member | Dashboard"],
        response: {
          200: z.object({
            success: z.boolean(),
            data: z.array(OrderResponseSchema),
          }),
        },
      },
    },
    (req, res) => orderController.listMyOrders(req as any, res),
  );

  /**
   * ✅ ROTA DE BUSCA POR ID (Com proteção Anti-IDOR interna no Controller)
   */
  typedApp.get(
    "/:id",
    {
      schema: {
        summary: "Busca detalhes de um pedido específico",
        tags: ["Member | Dashboard"],
        params: z.object({
          id: z.string().length(24, "ID de Pedido inválido"),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            data: OrderResponseSchema,
          }),
        },
      },
    },
    (req, res) => orderController.findById(req as any, res),
  );

  // --- 📋 ROTAS DE ADMIN ---

  typedApp.get(
    "/",
    {
      preHandler: [verifyRole([UserRole.ADMIN])],
      schema: {
        summary: "Listagem paginada de todos os pedidos",
        tags: ["Admin | Pedidos"],
        querystring: z.object({
          page: z.coerce.number().min(1).default(1),
          limit: z.coerce.number().min(1).max(100).default(10),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            data: z.array(OrderResponseSchema),
            total: z.number().optional(),
          }),
        },
      },
    },
    (req, res) => orderController.findAll(req as any, res),
  );

  typedApp.patch(
    "/:id/status",
    {
      preHandler: [verifyRole([UserRole.ADMIN])],
      schema: {
        summary: "Atualiza o status logístico do pedido",
        tags: ["Admin | Pedidos"],
        params: z.object({ id: z.string().length(24) }),
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
            data: OrderResponseSchema,
          }),
        },
      },
    },
    (req, res) => orderController.updateStatus(req as any, res),
  );
}
