import mongoose from "mongoose";
import logger from "../plugins/logger.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { OrderStatus } from "../types/order.type.js";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  /**
   * ✅ LISTA COM PAGINAÇÃO
   */
  async listAllOrders(page: number = 1, limit: number = 10) {
    return this.orderRepository.findAll(page, limit);
  }

  /**
   * ✅ ATUALIZA STATUS COM TRANSAÇÃO (ESTOQUE + PEDIDO)
   */
  async updateOrderStatus(id: string, status: OrderStatus) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await this.orderRepository.findById(id);

      if (!order) {
        throw new Error("Pedido não encontrado.");
      }

      // Só executa a baixa se estiver mudando para PAID pela primeira vez
      if (status === "paid" && order.status !== "paid") {
        logger.info(
          { orderId: id },
          "Pagamento confirmado. Baixando estoque...",
        );

        for (const item of order.items) {
          const success = await this.productRepository.updateStock(
            item.productId.toString(),
            -item.quantity,
            session,
          );

          if (!success) {
            throw new Error(`Estoque insuficiente para o produto ${item.name}`);
          }
        }
      }

      const updatedOrder = await this.orderRepository.updateStatus(
        id,
        status,
        session,
      );

      await session.commitTransaction();

      logger.info({ orderId: id, status }, "Pedido atualizado com sucesso.");

      return updatedOrder;
    } catch (err) {
      await session.abortTransaction();
      logger.error({ err, orderId: id }, "Erro ao atualizar status do pedido");
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * ✅ LISTA PEDIDOS DO USUÁRIO
   */
  async listUserOrders(userId: string) {
    if (!userId) throw new Error("Usuário não identificado.");
    return this.orderRepository.findByUserId(userId);
  }

  /**
   * ✅ BUSCA PEDIDO POR ID
   */
  async getOrderById(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new Error("Pedido inexistente.");
    return order;
  }
}
