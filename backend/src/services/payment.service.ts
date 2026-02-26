import mongoose from "mongoose";
import { OrderModel } from "../models/order.model.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { WhatsAppService } from "./whatsapp.service.js";

export interface PaymentResponse {
  type: "whatsapp_redirection" | "other";
  data: {
    ticket_url?: string;
    qr_code?: string;
    message?: string;
  };
}

// Interface para garantir contrato dos itens do pedido
interface OrderItem {
  productId: mongoose.Types.ObjectId | string;
  quantity: number;
}

export class PaymentService {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly whatsappService: WhatsAppService,
  ) {}

  public async processPayment(orderData: {
    id: string;
    total: number;
    email: string;
    method: string;
  }): Promise<PaymentResponse> {
    if (orderData.method !== "pix") {
      return {
        type: "other",
        data: { message: "Método não suportado para automação." },
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
   * Atualiza status com ACID Transaction para garantir integridade entre Order e Estoque
   */
  public async updateStatus(
    orderId: string,
    status: "paid" | "canceled",
    transactionId?: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await OrderModel.findById(orderId).session(session);

      if (!order) throw new NotFoundError("Pedido não encontrado.");
      if (order.status !== "pending") {
        throw new BadRequestError(
          `Transação negada: pedido já está como ${order.status}`,
        );
      }

      // Atualização de Status
      order.status = status;
      if (transactionId) {
        order.metadata = { ...order.metadata, transactionId };
      }

      await order.save({ session });

      // Reversão de estoque apenas se cancelado
      if (status === "canceled") {
        await Promise.all(
          (order.items as OrderItem[]).map((item) =>
            this.productRepo.updateStock(
              item.productId.toString(),
              -item.quantity, // Retorna ao estoque
            ),
          ),
        );
      }

      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
