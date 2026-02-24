import { FastifyReply, FastifyRequest } from "fastify";
import { PaymentService } from "../services/payment.service.js";

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  public confirm = async (
    req: FastifyRequest<{
      Params: { orderId: string };
      Body: { status: "paid" | "canceled"; transactionId?: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { orderId } = req.params;
    const { status, transactionId } = req.body;

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
