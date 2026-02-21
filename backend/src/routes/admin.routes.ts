import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import mongoose from "mongoose";
import { z } from "zod";

// --- Controllers ---
import { AdminController } from "../controllers/admin.controller.js";
import { CustomerController } from "../controllers/customer.controller.js";
import { OrderController } from "../controllers/order.controller.js";
import { ProductController } from "../controllers/product.controller.js";

// --- Repositories ---
import { AdminRepository } from "../repositories/admin.repository.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";

// --- Services ---
import { AdminService } from "../services/admin.service.js";
import { CheckoutService } from "../services/checkout.service.js";
import { CustomerService } from "../services/customer.service.js";
import { OrderService } from "../services/order.service.js";
import { ProductService } from "../services/product.service.js";
import { WhatsAppService } from "../services/whatsapp.service.js";

// --- Middlewares & Schemas ---
import { adminOnly, authenticate } from "../middlewares/authorization.js";
import { productQuerySchema } from "../schemas/product.schema.js";

export async function adminRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // ⚙️ 1. Infraestrutura & Providers
  const dbConnection = mongoose.connection;
  const whatsappService = new WhatsAppService();

  // 📦 2. Instanciação de Repositórios (Data Access)
  const productRepository = new ProductRepository();
  const orderRepository = new OrderRepository();
  const cartRepository = new CartRepository();
  const adminRepository = new AdminRepository();
  const customerRepository = new CustomerRepository();

  // 🧠 3. Injeção de Dependências nos Serviços
  const productService = new ProductService(productRepository);
  const adminService = new AdminService(adminRepository);
  const customerService = new CustomerService(customerRepository);

  // Serviço de Pedidos (Geral)
  const orderService = new OrderService(
    orderRepository,
    productRepository,
    dbConnection,
  );

  // Serviço de Checkout (Transacional - 5 Argumentos)
  const checkoutService = new CheckoutService(
    orderRepository,
    cartRepository,
    productRepository,
    whatsappService, // 4º: Provedor de pagamento
    dbConnection, // 5º: Conexão para sessões/transações
  );

  // 🎮 4. Instanciação de Controllers
  const productController = new ProductController(productService);
  const orderController = new OrderController(orderService, checkoutService);
  const adminController = new AdminController(adminService, adminRepository);
  const customerController = new CustomerController(customerService);

  /**
   * 🛡️ GRUPO DE ROTAS PROTEGIDAS (Admin Only)
   */
  typedApp.register(async (adminGroup) => {
    adminGroup.addHook("onRequest", authenticate);
    adminGroup.addHook("preHandler", adminOnly);

    // --- SEÇÃO: PRODUTOS ---
    adminGroup.post(
      "/products/seed",
      {
        schema: {
          tags: ["Admin | Produtos"],
          summary: "Popular banco de dados",
        },
      },
      productController.seed.bind(productController),
    );

    adminGroup.get(
      "/products",
      {
        schema: {
          tags: ["Admin | Produtos"],
          summary: "Listar produtos",
          querystring: productQuerySchema,
        },
      },
      productController.findAll.bind(productController),
    );

    // --- SEÇÃO: CLIENTES ---
    adminGroup.get(
      "/customers",
      {
        schema: {
          tags: ["Admin | Clientes"],
          summary: "Listar clientes cadastrados",
          querystring: z.object({
            page: z.coerce.number().default(1),
            limit: z.coerce.number().default(50),
          }),
        },
      },
      customerController.getAll.bind(customerController),
    );

    adminGroup.delete(
      "/customers/:id",
      {
        schema: {
          tags: ["Admin | Clientes"],
          summary: "Remover cliente permanentemente",
          params: z.object({
            id: z.string().length(24, "ID do MongoDB inválido"),
          }),
        },
      },
      customerController.delete.bind(customerController),
    );

    // --- SEÇÃO: PEDIDOS ---
    adminGroup.get(
      "/orders",
      {
        schema: {
          tags: ["Admin | Pedidos"],
          summary: "Monitorar todos os pedidos",
          querystring: z.object({
            page: z.coerce.number().default(1),
            limit: z.coerce.number().default(10),
          }),
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
        },
      },
      orderController.updateStatus.bind(orderController),
    );

    // --- SEÇÃO: PERFIL ---
    adminGroup.get(
      "/profile",
      { schema: { tags: ["Admin | Perfil"], summary: "Dados do admin" } },
      adminController.getAdminProfile.bind(adminController),
    );
  });
}
