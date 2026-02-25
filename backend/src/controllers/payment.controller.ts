// src/controllers/payment.controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { PaymentService } from "../services/payment.service.js";

// Definindo os tipos para os parâmetros e corpo da requisição
type ConfirmParams = { orderId: string };
type ConfirmBody = { status: "paid" | "canceled"; transactionId?: string };

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  public confirm = async (
    req: FastifyRequest<{ Params: ConfirmParams; Body: ConfirmBody }>,
    reply: FastifyReply,
  ) => {
    const { orderId } = req.params;
    const { status, transactionId } = req.body;

    // Sem try/catch: o erro lançado pelo service (NotFoundError/BadRequestError)
    // será capturado pelo ErrorHandler global do Fastify.
    const order = await this.paymentService.updateStatus(
      orderId,
      status,
      transactionId,
    );

    return reply.send({
      success: true,
      message: `Pedido atualizado com sucesso para: ${status}`,
      data: {
        orderId: order._id,
        status: order.status,
        customerEmail: order.customerEmail,
      },
    });
  };
}
