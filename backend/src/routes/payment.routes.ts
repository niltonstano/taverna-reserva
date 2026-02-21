import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { PaymentController } from "../controllers/payment.controller.js";
import { adminOnly, authenticate } from "../middlewares/authorization.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { PaymentService } from "../services/payment.service.js";

export async function paymentRoutes(app: FastifyInstance) {
  // 1. Setup com Zod para validação rigorosa
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // 2. Injeção de Dependências
  const productRepo = new ProductRepository();
  const service = new PaymentService(productRepo);
  const controller = new PaymentController(service);

  /**
   * 🛡️ Grupo Protegido: Apenas Admins podem confirmar pagamentos
   */
  typedApp.register(async (adminGroup) => {
    // Aplicando os mesmos middlewares das adminRoutes
    adminGroup.addHook("onRequest", authenticate);
    adminGroup.addHook("preHandler", adminOnly);

    adminGroup.post(
      "/confirm/:orderId",
      {
        schema: {
          tags: ["Admin | Pagamentos"],
          summary: "Confirmar pagamento manual (WhatsApp/Pix)",
          params: z.object({
            orderId: z.string().length(24, "ID do MongoDB inválido"),
          }),
          body: z.object({
            status: z.enum(["paid", "canceled"]),
            transactionId: z.string().optional(),
          }),
        },
      },
      controller.confirm.bind(controller),
    );
  });
}
