// src/services/payment.service.ts
import { OrderModel } from "../models/order.model.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class PaymentService {
  constructor(private readonly productRepo: ProductRepository) {}

  public async updateStatus(
    orderId: string,
    status: "paid" | "canceled",
    transactionId?: string,
  ) {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError("Pedido não encontrado.");

    // Evita processar pedidos que já saíram do estado pendente
    if (order.status !== "pending") {
      throw new BadRequestError(`Pedido já está ${order.status}.`);
    }

    order.status = status;
    if (transactionId) {
      order.metadata = { ...order.metadata, transactionId };
    }

    await order.save();

    // 🔄 Se cancelar, devolvemos os itens ao estoque
    if (status === "canceled") {
      for (const item of order.items) {
        // Passamos o valor negativo da quantidade comprada para "subtrair o negativo" (somar)
        // Se o seu repo usa qty positiva para tirar, aqui usamos o inverso.
        await this.productRepo.updateStock(
          item.productId as any,
          -item.quantity,
        );
      }
    }

    return order;
  }
}
