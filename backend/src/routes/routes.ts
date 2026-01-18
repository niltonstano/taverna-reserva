// Caminho sugerido: src/routes/routes.ts
import { FastifyInstance } from "fastify";
import { adminRoutes } from "./admin.routes.js";
import { authRoutes } from "./auth.routes.js";
import { cartRoutes } from "./cart.routes.js";
import { checkoutRoutes } from "./checkout.routes.js";
import { customerRoutes } from "./customer.routes.js";
import { healthRoutes } from "./health.routes.js";
import { orderRoutes } from "./order.routes.js";
import { productRoutes } from "./product.routes.js";

export async function appRoutes(app: FastifyInstance) {
  const prefix = "/api/v1";

  await app.register(healthRoutes, { prefix: `${prefix}/health` });
  await app.register(authRoutes, { prefix: `${prefix}/auth` });
  await app.register(productRoutes, { prefix: `${prefix}/products` });
  await app.register(customerRoutes, { prefix: `${prefix}/customer` });
  await app.register(cartRoutes, { prefix: `${prefix}/cart` });
  await app.register(orderRoutes, { prefix: `${prefix}/orders` }); // Chama o arquivo abaixo
  await app.register(checkoutRoutes, { prefix: `${prefix}/checkout` });
  await app.register(adminRoutes, { prefix: `${prefix}/admin` });
}
