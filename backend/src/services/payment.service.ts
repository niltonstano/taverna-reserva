import mongoose from "mongoose";
import { OrderModel } from "../models/order.model.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { WhatsAppService } from "./whatsapp.service.js";

/**
 * Interface de resposta para o redirecionamento de pagamento
 */
export interface PaymentResponse {
  type: "whatsapp_redirection" | "other";
  data: {
    ticket_url?: string;
    qr_code?: string;
    message?: string;
  };
}

/**
 * Interface interna para tipagem de itens do pedido
 */
interface OrderItem {
  productId: mongoose.Types.ObjectId | string;
  quantity: number;
}

export class PaymentService {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly whatsappService: WhatsAppService,
  ) {}

  /**
   * Processa a intenção de pagamento inicial
   */
  public async processPayment(orderData: {
    id: string;
    total: number;
    email: string;
    method: string;
  }): Promise<PaymentResponse> {
    // Atualmente, a automação está focada em PIX via WhatsApp
    if (orderData.method !== "pix") {
      return {
        type: "other",
        data: {
          message: "Método não suportado para automação de redirecionamento.",
        },
      };
    }

    const whatsappData = await this.whatsappService.generatePix(
      orderData.id,
      orderData.total,
      orderData.email,
    );

    return {
      type: "whatsapp_redirection",
      data: whatsappData,
    };
  }

  /**
   * Atualiza o status do pedido com ACID Transactions
   * Garante consistência entre o status do pedido e o estoque físico
   */
  public async updateStatus(
    orderId: string,
    status: "paid" | "canceled",
    transactionId?: string,
  ) {
    return await this.runInTransaction(async (session) => {
      const order = await OrderModel.findById(orderId).session(session);

      if (!order) {
        throw new NotFoundError("Pedido não encontrado no banco de dados.");
      }

      // Regra de Negócio: Não permite alterar pedidos que não estão pendentes
      if (order.status !== "pending") {
        throw new BadRequestError(
          `Operação inválida: O pedido #${orderId} já possui status '${order.status}'`,
        );
      }

      // Aplica a transição de status
      order.status = status;
      if (transactionId) {
        order.metadata = {
          ...order.metadata,
          transactionId,
          updatedAt: new Date(),
        };
      }

      await order.save({ session });

      // Se o pedido for cancelado, devolvemos os itens ao estoque
      if (status === "canceled") {
        await this.handleStockReversal(order.items as OrderItem[]);
      }

      return order;
    });
  }

  /**
   * Reverte o estoque de forma atômica
   */
  private async handleStockReversal(items: OrderItem[]): Promise<void> {
    await Promise.all(
      items.map((item) =>
        this.productRepo.updateStock(
          item.productId.toString(),
          -item.quantity, // Valor negativo no updateStock subtrai da reserva (devolve ao disponível)
        ),
      ),
    );
  }

  /**
   * Wrapper utilitário para gerenciar o ciclo de vida de uma transação Mongoose.
   * Centraliza o start, commit, abort e end da sessão.
   */
  private async runInTransaction<T>(
    fn: (session: mongoose.ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      // Se houver qualquer erro, a transação é revertida (Atomicity)
      await session.abortTransaction();
      throw error; // Re-lança para o ErrorHandler global (Express Middleware)
    } finally {
      session.endSession();
    }
  }
}
