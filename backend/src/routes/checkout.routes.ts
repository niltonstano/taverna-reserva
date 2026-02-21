import { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { z } from "zod";
import { CheckoutController } from "../controllers/checkout.controller.js";
import { authenticate } from "../middlewares/authorization.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { CheckoutService } from "../services/checkout.service.js";

/**
 * ✅ SCHEMA DE RESPOSTA (Contrato de Saída)
 * Garante que o Fastify serialize os dados corretamente para o Frontend.
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
      payment_id: z.number(),
    })
    .optional(),
});

/**
 * 🍷 MÓDULO DE CHECKOUT
 * Centraliza a orquestração de pedidos e integração de pagamento.
 */
export async function checkoutRoutes(app: FastifyInstance) {
  // Provider customizado para o fluxo de WhatsApp da Taverna
  const whatsappProvider = {
    generatePaymentLink: (id: string, total: number) =>
      `https://wa.me/5511999999999?text=${encodeURIComponent(
        `*NOVA RESERVA - TAVERNA*\nID: #${id}\nTotal: R$ ${(total / 100).toFixed(2)}`,
      )}`,
  };

  // Injeção de Dependências (Clean Architecture)
  const checkoutService = new CheckoutService(
    new OrderRepository(),
    new CartRepository(),
    new ProductRepository(),
    whatsappProvider,
    mongoose.connection,
  );

  const controller = new CheckoutController(checkoutService);

  /**
   * 🚀 ENDPOINT: Processamento de Reserva
   * - preHandler: Garante que apenas usuários autenticados acessem.
   * - schema: Define os requisitos rígidos de Headers e Response.
   */
  app.post(
    "/process",
    {
      preHandler: [authenticate],
      schema: {
        // ✅ OBRIGATÓRIO: Permite que o 'idempotency-key' passe pelo validador do Fastify
        headers: z
          .object({
            "idempotency-key": z.string({
              required_error:
                "O cabeçalho 'idempotency-key' é obrigatório para garantir a unicidade do pedido.",
            }),
          })
          .passthrough(),
        response: {
          201: checkoutResponseSchema,
        },
      },
    },
    // Bind necessário para manter o contexto da classe Controller
    controller.handle.bind(controller),
  );

  app.log.info("✅ Checkout Routes carregadas com validação de idempotência.");
}
