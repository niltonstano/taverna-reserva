import { FastifyInstance } from "fastify";
import { ShippingController } from "../controllers/shipping.controller.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { ShippingService } from "../services/shipping.service.js";

export async function shippingRoutes(fastify: FastifyInstance) {
  const service = new ShippingService(
    new ProductRepository(),
    new CartRepository(),
  );
  const controller = new ShippingController(service);

  fastify.post("/calculate", (req, rep) =>
    controller.calculateCartShipping(req as any, rep),
  );
}
