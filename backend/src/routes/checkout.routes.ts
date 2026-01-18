import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import mongoose from "mongoose";
import {
  CheckoutBodySchema,
  CheckoutController,
  CheckoutHeadersSchema,
  CheckoutRoute,
} from "../controllers/checkout.controller.js";
import { authenticate } from "../middlewares/authorization.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { CheckoutService } from "../services/checkout.service.js";

export async function checkoutRoutes(app: FastifyInstance) {
  // Ativa o provedor de tipos Zod para esta instância de rotas
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // Injeção de dependências
  const checkoutService = new CheckoutService(
    new OrderRepository(),
    new CartRepository(),
    new ProductRepository(),
    mongoose.connection
  );

  const checkoutController = new CheckoutController(checkoutService);

  typedApp.post(
    "/",
    {
      schema: {
        tags: ["Checkout"],
        summary: "Finalizar compra do carrinho",
        description:
          "Valida estoque e processa o pedido usando transações ACID.",
        headers: CheckoutHeadersSchema,
        body: CheckoutBodySchema,
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      /**
       * O 'request' gerado pelo ZodTypeProvider possui metadados complexos.
       * O cast abaixo compatibiliza esse objeto com a interface simples do Controller.
       */
      await checkoutController.handle(
        request as unknown as FastifyRequest<CheckoutRoute>,
        reply
      );
    }
  );
}
