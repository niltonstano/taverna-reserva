import { FastifyInstance } from "fastify";
import { adminRoutes } from "./admin.routes.js";
import { authRoutes } from "./auth.routes.js";
import { cartRoutes } from "./cart.routes.js";
import { checkoutRoutes } from "./checkout.routes.js";
import { customerRoutes } from "./customer.routes.js";
import { healthRoutes } from "./health.routes.js";
import { orderRoutes } from "./order.routes.js";
import { paymentRoutes } from "./payment.routes.js";
import { productRoutes } from "./product.routes.js";
import { shippingRoutes } from "./shipping.routes.js";

/**
 * Definição dos módulos da API.
 * ATENÇÃO: Os prefixos aqui são relativos ao prefixo global "/api/v1"
 * definido no buildApp (app.ts).
 */
const apiModules = [
  { plugin: healthRoutes, prefix: "/health" },
  { plugin: authRoutes, prefix: "/auth" },
  { plugin: customerRoutes, prefix: "/customer" },
  { plugin: productRoutes, prefix: "/products" },
  { plugin: shippingRoutes, prefix: "/shipping" },
  { plugin: cartRoutes, prefix: "/cart" },
  { plugin: checkoutRoutes, prefix: "/checkout" },
  { plugin: orderRoutes, prefix: "/orders" },
  { plugin: paymentRoutes, prefix: "/payments" },
  { plugin: adminRoutes, prefix: "/admin" },
];

/**
 * Agregador de Rotas Principal
 * Registra todos os módulos no Fastify de forma encapsulada.
 */
export async function appRoutes(app: FastifyInstance) {
  // Nota Sênior: Não repetimos "/api/v1" aqui para evitar rotas como "/api/v1/api/v1/products"

  for (const module of apiModules) {
    // Garante que o prefixo comece com barra única
    const cleanPrefix = module.prefix.startsWith("/")
      ? module.prefix
      : `/${module.prefix}`;

    await app.register(module.plugin, {
      prefix: cleanPrefix,
    });
  }

  app.log.info(
    `✅ [Router] ${apiModules.length} módulos registrados no escopo atual.`,
  );
}
