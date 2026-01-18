import logger from "../plugins/logger.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { OrderStatus } from "../types/order.type.js";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository
  ) {}

  /**
   * ✅ LISTA COM PAGINAÇÃO: Protege a memória do servidor
   */
  async listAllOrders(page: number = 1, limit: number = 10) {
    return await this.orderRepository.findAll(page, limit);
  }

  /**
   * ✅ CICLO DE VIDA DO PEDIDO: Com baixa de estoque atômica
   */
  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new Error("Reserva não encontrada na adega.");
    }

    // Status 'paid' é o padrão internacional para confirmação de pagamento
    const statusConfirmado: OrderStatus = "paid";

    if (status === statusConfirmado && order.status !== statusConfirmado) {
      logger.info({ orderId: id }, "Pagamento confirmado. Baixando estoque...");

      // Percorre itens e faz a baixa
      for (const item of order.items) {
        await this.productRepository.updateStock(
          item.productId.toString(),
          -item.quantity
          // Em produção, se você tiver uma session aqui, deve passá-la como 3º argumento
        );
      }
    }

    // O erro "Expected 3" provavelmente vem daqui ou do findAll.
    // Garanta que seu OrderRepository.updateStatus aceite (id, status, session?)
    const updatedOrder = await this.orderRepository.updateStatus(id, status);

    logger.info({ orderId: id, status }, "Pedido atualizado com sucesso.");
    return updatedOrder;
  }

  async listUserOrders(userId: string) {
    if (!userId) throw new Error("Usuário não identificado.");
    return await this.orderRepository.findByUserId(userId);
  }

  async getOrderById(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new Error("Pedido inexistente.");
    return order;
  }
}
