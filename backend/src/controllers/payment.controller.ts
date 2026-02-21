// src/controllers/payment.controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { PaymentService } from "../services/payment.service.js";

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  public async confirm(req: FastifyRequest, reply: FastifyReply) {
    const { orderId } = req.params as { orderId: string };
    const { status, transactionId } = req.body as {
      status: "paid" | "canceled";
      transactionId?: string;
    };

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
  }
}
