import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import mongoose from "mongoose";
import { z } from "zod";

// --- 🏗️ CORE DOMAIN & INFRA ---
import { OrderController } from "../controllers/order.controller.js";
import {
  authenticate,
  UserRole,
  verifyRole,
} from "../middlewares/authorization.js";

// --- 📦 REPOSITORIES & SERVICES ---
import { CartRepository } from "../repositories/cart.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { CheckoutService } from "../services/checkout.service.js";
import { OrderService } from "../services/order.service.js";
import { WhatsAppService } from "../services/whatsapp.service.js"; // ✅ Integrado

// --- 📝 SCHEMAS DE VALIDAÇÃO (ENTRADA) ---
import {
  createOrderSchema,
  findAllQuerySchema,
  orderHeadersSchema,
  orderIdParamSchema,
  updateOrderSchema,
} from "../schemas/order.schema.js";

// --- 📝 SCHEMA DE RESPOSTA (SAÍDA) ---
const OrderResponseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
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
    status: z.string(),
    address: z.string(),
    zipCode: z.string(),
    createdAt: z.string(),
  })
  .passthrough();

/**
 * 🍷 ORDER ROUTES SYSTEM
 * Centraliza a gestão de pedidos, checkout e administração logística.
 */
export async function orderRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  /** * 🏗️ COMPOSITION ROOT (Dependency Injection)
   * Instanciação das camadas seguindo Clean Architecture.
   */
  const orderRepo = new OrderRepository();
  const productRepo = new ProductRepository();
  const cartRepo = new CartRepository();
  const connection = mongoose.connection;

  // ✅ Usando o serviço de WhatsApp real para gerar os links de pagamento
  const paymentProvider = new WhatsAppService();

  const orderService = new OrderService(orderRepo, productRepo, connection);
  const checkoutService = new CheckoutService(
    orderRepo,
    cartRepo,
    productRepo,
    paymentProvider,
    connection,
  );

  const orderController = new OrderController(orderService, checkoutService);

  /** 🛡️ SECURITY HOOK: Todas as rotas de pedidos exigem autenticação JWT */
  typedApp.addHook("onRequest", authenticate);

  // --- 🛒 SEÇÃO: SHOPPER (CLIENTE) ---

  typedApp.post(
    "/checkout",
    {
      schema: {
        summary: "🛒 Finalizar pedido (Checkout)",
        description: "Cria o pedido e gera o link de pagamento via WhatsApp.",
        tags: ["Pedidos"],
        body: createOrderSchema,
        headers: orderHeadersSchema,
        response: {
          201: z.object({
            success: z.boolean(),
            message: z.string(),
            order: OrderResponseSchema,
            payment_data: z.any().optional(),
          }),
        },
      },
    },
    async (req, res) => orderController.checkout(req as any, res),
  );

  typedApp.get(
    "/my-orders",
    {
      schema: {
        summary: "📋 Meus pedidos",
        tags: ["Pedidos"],
      },
    },
    async (req, res) => orderController.listMyOrders(req as any, res),
  );

  typedApp.get(
    "/:id",
    {
      schema: {
        summary: "🔍 Detalhes do pedido",
        tags: ["Pedidos"],
        params: orderIdParamSchema,
      },
    },
    async (req, res) => orderController.findById(req as any, res),
  );

  // --- 📋 SEÇÃO: LOGÍSTICA (ADMIN) ---

  typedApp.get(
    "/",
    {
      preHandler: [verifyRole([UserRole.ADMIN])],
      schema: {
        summary: "👨‍💼 Gerenciamento de Pedidos (Admin)",
        tags: ["Admin | Pedidos"],
        querystring: findAllQuerySchema,
      },
    },
    async (req, res) => orderController.findAll(req as any, res),
  );

  typedApp.patch(
    "/:id/status",
    {
      preHandler: [verifyRole([UserRole.ADMIN])],
      schema: {
        summary: "🔄 Atualizar Status Logístico",
        tags: ["Admin | Pedidos"],
        params: orderIdParamSchema,
        body: updateOrderSchema,
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OrderResponseSchema,
          }),
        },
      },
    },
    async (req, res) => orderController.updateStatus(req as any, res),
  );
}
