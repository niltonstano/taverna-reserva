import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { PaymentController } from "../controllers/payment.controller.js";
import { adminOnly, authenticate } from "../middlewares/authorization.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { PaymentService } from "../services/payment.service.js";
import { WhatsAppService } from "../services/whatsapp.service.js"; // Importe aqui

export async function paymentRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // ✅ Injeção de Dependências Correta
  const productRepo = new ProductRepository();
  const whatsappService = new WhatsAppService();
  const service = new PaymentService(productRepo, whatsappService); // Agora com 2 argumentos!
  const controller = new PaymentController(service);

  typedApp.register(async (adminGroup) => {
    adminGroup.addHook("onRequest", authenticate);
    adminGroup.addHook("preHandler", adminOnly);

    adminGroup.post(
      "/confirm/:orderId",
      {
        schema: {
          tags: ["Admin | Pagamentos"],
          summary: "Confirmar pagamento manual",
          params: z.object({
            orderId: z.string().length(24, "ID inválido"),
          }),
          body: z.object({
            status: z.enum(["paid", "canceled"]),
            transactionId: z.string().optional(),
          }),
        },
      },
      controller.confirm,
    );
  });
}
