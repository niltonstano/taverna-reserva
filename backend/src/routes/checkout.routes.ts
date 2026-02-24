import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import mongoose from "mongoose";
import { z } from "zod";
import { CheckoutController } from "../controllers/checkout.controller.js";
import { authenticate } from "../middlewares/authorization.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import {
  CheckoutBodySchema,
  CheckoutHeadersSchema,
} from "../schemas/checkout.schema.js";
import { CheckoutService } from "../services/checkout.service.js";

/**
 * ✅ SCHEMA DE RESPOSTA
 */
export const checkoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  order: z.any(),
  payment_data: z
    .object({
      qr_code: z.string(),
      qr_code_base64: z.string(),
      ticket_url: z.string(),
      payment_id: z.any(),
    })
    .optional(),
});

/**
 * 🍷 MÓDULO DE CHECKOUT
 */
export async function checkoutRoutes(app: FastifyInstance) {
  // 1. Vincula o Provider de Tipos
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // 2. Mock do Provider (Satisfazendo a Interface)
  const whatsappProvider = {
    generatePix: async (orderId: string, totalCents: number, email: string) => {
      const link = `https://wa.me/5511999999999?text=${encodeURIComponent(`ID: #${orderId}`)}`;
      return {
        qr_code: link,
        qr_code_base64: "",
        ticket_url: link,
        payment_id: `WA-${Date.now()}`,
      };
    },
  };

  const checkoutService = new CheckoutService(
    new OrderRepository(),
    new CartRepository(),
    new ProductRepository(),
    whatsappProvider as any,
    mongoose.connection,
  );

  const controller = new CheckoutController(checkoutService);

  /**
   * 🚀 ENDPOINT: Processamento de Reserva
   */
  typedApp.post(
    "/process",
    {
      preHandler: [authenticate],
      schema: {
        body: CheckoutBodySchema,
        headers: CheckoutHeadersSchema,
        response: {
          201: checkoutResponseSchema,
        },
      },
    },
    /**
     *
     *
     *
     */
    controller.handle.bind(controller) as any,
  );

  app.log.info("✅ Checkout Routes carregadas.");
}
