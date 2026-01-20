import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import mongoose from "mongoose";
import { z } from "zod";

// Controllers
import { AdminController } from "../controllers/admin.controller.js";
import { CustomerController } from "../controllers/customer.controller.js";
import { OrderController } from "../controllers/order.controller.js";
import { ProductController } from "../controllers/product.controller.js";

// Repositories
import { AdminRepository } from "../repositories/admin.repository.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";

// Services
import { AdminService } from "../services/admin.service.js";
import { CheckoutService } from "../services/checkout.service.js";
import { CustomerService } from "../services/customer.service.js";
import { OrderService } from "../services/order.service.js";
import { ProductService } from "../services/product.service.js";

// Middlewares & Schemas
import { adminOnly, authenticate } from "../middlewares/authorization.js";
import { productQuerySchema } from "../schemas/product.schema.js";

export async function adminRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // 1. Instanciando Repositories
  const productRepository = new ProductRepository();
  const orderRepository = new OrderRepository();
  const cartRepository = new CartRepository();
  const adminRepository = new AdminRepository();
  const customerRepository = new CustomerRepository();

  // 2. Instanciando Services
  const productService = new ProductService(productRepository);
  const orderService = new OrderService(orderRepository, productRepository);
  const adminService = new AdminService(adminRepository);
  const customerService = new CustomerService(customerRepository);
  const checkoutService = new CheckoutService(
    orderRepository,
    cartRepository,
    productRepository,
    mongoose.connection,
  );

  // 3. Instanciando Controllers
  const productController = new ProductController(productService);
  const orderController = new OrderController(orderService, checkoutService);
  const adminController = new AdminController(adminService, adminRepository);
  const customerController = new CustomerController(customerService);

  /**
   * 🛡️ GRUPO DE ROTAS PROTEGIDAS (Apenas Administradores)
   */
  typedApp.register(async (adminGroup) => {
    // Hooks de segurança global para o grupo
    adminGroup.addHook("onRequest", authenticate);
    adminGroup.addHook("preHandler", adminOnly);

    // --- GESTÃO DE PRODUTOS ---
    adminGroup.post(
      "/products/seed",
      {
        schema: {
          tags: ["Admin | Produtos"],
          summary: "Popular banco de dados inicial",
          security: [{ bearerAuth: [] }],
        },
      },
      productController.seed.bind(productController),
    );

    adminGroup.get(
      "/products",
      {
        schema: {
          tags: ["Admin | Produtos"],
          summary: "Listar produtos para gestão interna",
          querystring: productQuerySchema,
          security: [{ bearerAuth: [] }],
        },
      },
      productController.findAll.bind(productController),
    );

    // --- GESTÃO DE CLIENTES ---
    adminGroup.get(
      "/customers",
      {
        schema: {
          tags: ["Admin | Clientes"],
          summary: "Listar todos os clientes cadastrados",
          querystring: z.object({
            page: z.coerce.number().default(1),
            limit: z.coerce.number().default(50),
          }),
          security: [{ bearerAuth: [] }],
        },
      },
      (req, res) => customerController.getAll(req, res),
    );

    // --- GESTÃO DE PEDIDOS ---
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
      orderController.findAll.bind(orderController),
    );

    adminGroup.patch(
      "/orders/:id/status",
      {
        schema: {
          tags: ["Admin | Pedidos"],
          summary: "Atualizar status do pedido",
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
      orderController.updateStatus.bind(orderController),
    );

    // --- PERFIL ADMINISTRATIVO ---
    adminGroup.get(
      "/profile",
      {
        schema: {
          tags: ["Admin | Perfil"],
          summary: "Ver dados do perfil logado",
          security: [{ bearerAuth: [] }],
        },
      },
      adminController.getAdminProfile.bind(adminController),
    );
  });
}
