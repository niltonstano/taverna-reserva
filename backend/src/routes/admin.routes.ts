import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import mongoose from "mongoose";
import { z } from "zod";

import { AdminController } from "../controllers/admin.controller.js";
import { OrderController } from "../controllers/order.controller.js";
import { ProductController } from "../controllers/product.controller.js";
import { adminOnly, authenticate } from "../middlewares/authorization.js";
import { AdminRepository } from "../repositories/admin.repository.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { productQuerySchema } from "../schemas/product.schema.js";
import { AdminService } from "../services/admin.service.js";
import { CheckoutService } from "../services/checkout.service.js";
import { OrderService } from "../services/order.service.js";
import { ProductService } from "../services/product.service.js";

export async function adminRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // 1. Repositories
  const productRepository = new ProductRepository();
  const orderRepository = new OrderRepository();
  const cartRepository = new CartRepository();
  const adminRepository = new AdminRepository();

  // 2. Services
  const productService = new ProductService(productRepository);
  const orderService = new OrderService(orderRepository, productRepository);
  const adminService = new AdminService(adminRepository);
  const checkoutService = new CheckoutService(
    orderRepository,
    cartRepository,
    productRepository,
    mongoose.connection
  );

  // 3. Controllers
  const productController = new ProductController(productService);
  const orderController = new OrderController(orderService, checkoutService);
  const adminController = new AdminController(adminService, adminRepository);

  /**
   * 🛡️ GRUPO DE ROTAS PROTEGIDAS (Admin Only)
   */
  typedApp.register(async (adminGroup) => {
    adminGroup.addHook("onRequest", authenticate);
    adminGroup.addHook("preHandler", adminOnly);

    // --- PRODUTOS ---
    adminGroup.post(
      "/products/seed",
      { schema: { tags: ["Admin | Produtos"], summary: "Popular banco" } },
      productController.seed.bind(productController)
    );

    adminGroup.get(
      "/products",
      {
        schema: {
          tags: ["Admin | Produtos"],
          summary: "Listar produtos para gestão",
          querystring: productQuerySchema,
        },
      },
      productController.findAll.bind(productController)
    );

    // --- GESTÃO DE PEDIDOS (AdminOrders.tsx) ---
    adminGroup.get(
      "/orders",
      {
        schema: {
          tags: ["Admin | Pedidos"],
          summary: "Listar todas as reservas para logística",
          querystring: z.object({
            page: z.coerce.number().default(1),
            limit: z.coerce.number().default(10),
          }),
          security: [{ bearerAuth: [] }],
        },
      },
      orderController.findAll.bind(orderController)
    );

    adminGroup.patch(
      "/orders/:id/status",
      {
        schema: {
          tags: ["Admin | Pedidos"],
          summary: "Atualizar status do rastreio",
          params: z.object({ id: z.string().min(24) }),
          body: z.object({
            status: z.enum([
              "pending",
              "paid",
              "shipped",
              "delivered",
              "cancelled",
            ]),
          }),
          security: [{ bearerAuth: [] }],
        },
      },
      orderController.updateStatus.bind(orderController)
    );

    // --- PERFIL ---
    adminGroup.get(
      "/profile",
      { schema: { tags: ["Admin | Perfil"], summary: "Ver perfil admin" } },
      adminController.getAdminProfile.bind(adminController)
    );
  });
}
