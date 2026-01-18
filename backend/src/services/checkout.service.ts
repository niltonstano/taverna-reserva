/* eslint-disable no-await-in-loop */
import { ClientSession, Connection, Types } from "mongoose";
import { eventBus, EventNames } from "../events/event-bus.js";
import logger from "../plugins/logger.js";
import { CartRepository } from "../repositories/cart.repository.js";
import {
  OrderCreateInput,
  OrderItem,
  OrderReadModel,
  OrderRepository,
} from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";

/**
 * ✅ INTERFACES SANITIZADAS
 */
interface CartItemPopulated {
  productId: {
    _id: Types.ObjectId;
    name: string;
    price: number;
    active: boolean;
  };
  quantity: number;
}

interface PaymentData {
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
  payment_id: number;
}

export interface CheckoutResult {
  order: OrderReadModel;
  payment_data: PaymentData;
}

interface MongoTransactionError extends Error {
  hasErrorLabel?: (label: string) => boolean;
}

/**
 * ✅ SERVIÇO DE CHECKOUT PROFISSIONAL
 * Implementa: Idempotência, Transações ACID, Retry Logic e Sanitização de Tipos.
 */
export class CheckoutService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly connection: Connection
  ) {}

  public async execute(
    userId: string,
    idempotencyKey: string,
    userEmail: string
  ): Promise<CheckoutResult> {
    const cleanUserId = this.validateAndConvertId(userId);

    // 1️⃣ SEGURANÇA: Camada de Idempotência (Evita duplicidade no banco e cobrança)
    const existingOrder = await this.orderRepository.findByIdempotencyKey(
      cleanUserId,
      idempotencyKey
    );

    if (existingOrder) {
      logger.warn(
        { userId, idempotencyKey },
        "Idempotência acionada: Retornando pedido existente."
      );
      return {
        order: existingOrder,
        payment_data: this.generateMockPayment(existingOrder._id.toString()),
      };
    }

    const MAX_RETRIES = 3;
    let finalOrder: OrderReadModel | null = null;

    // 2️⃣ DADOS: Transação ACID com Lógica de Retentativa
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const session: ClientSession = await this.connection.startSession();
      try {
        await session.withTransaction(async () => {
          const cartData = await this.cartRepository.findByUserId(cleanUserId);
          const cart = cartData as unknown as {
            items: CartItemPopulated[];
          } | null;

          if (!cart?.items?.length) throw new Error("Carrinho vazio.");

          const validatedItems: OrderItem[] = [];
          let totalAccumulated = 0;

          // Validação de estoque e preços em tempo real
          for (const item of cart.items) {
            const pId = item.productId._id.toString();
            const product = await this.productRepository.findById(pId);

            if (!product?.active)
              throw new Error(`Produto ${product?.name || pId} indisponível.`);

            // Baixa de estoque ATÔMICA (Evita venda sem estoque por milissegundos)
            const hasStock = await this.productRepository.updateStock(
              pId,
              item.quantity,
              session
            );
            if (!hasStock)
              throw new Error(`Estoque insuficiente: ${product.name}`);

            const subtotal = Number((product.price * item.quantity).toFixed(2));
            totalAccumulated += subtotal;

            validatedItems.push({
              productId: pId,
              name: product.name,
              quantity: item.quantity,
              price: product.price,
              subtotal,
            });
          }

          const orderData: OrderCreateInput = {
            userId: new Types.ObjectId(cleanUserId),
            items: validatedItems,
            totalPrice: Number(totalAccumulated.toFixed(2)),
            status: "pending",
            idempotencyKey,
            customerEmail: userEmail,
          };

          const createdDoc = await this.orderRepository.create(orderData, {
            session,
          });

          // Limpeza do carrinho vinculada ao sucesso do pedido
          await this.cartRepository.clearCart(cleanUserId, session);

          // Sanitização: Converte de Documento Mongoose para Objeto Puro (POJO)
          finalOrder = JSON.parse(JSON.stringify(createdDoc)) as OrderReadModel;
        });

        break; // Sucesso: sai do loop de retentativas
      } catch (err) {
        const error = err as MongoTransactionError;
        // Erros de concorrência (TransientTransactionError) permitem nova tentativa
        if (
          error.hasErrorLabel?.("TransientTransactionError") &&
          attempt < MAX_RETRIES
        ) {
          logger.warn(
            { attempt, userId },
            "Conflito de escrita (Write Conflict). Tentando novamente..."
          );
          continue;
        }
        throw error;
      } finally {
        await session.endSession();
      }
    }

    // ✅ CHECK FINAL: O TypeScript agora entende que finalOrder não é 'never'
    if (!finalOrder) {
      throw new Error("Erro interno: Falha ao gerar objeto do pedido.");
    }

    const order: OrderReadModel = finalOrder;
    const orderId = order._id.toString();

    // 3️⃣ INTEGRAÇÃO: Gateway de Pagamento e Eventos
    const payment = this.generateMockPayment(orderId);
    this.emitOrderEvent(order, cleanUserId);

    return {
      order,
      payment_data: payment,
    };
  }

  /**
   * ✅ MÉTODOS PRIVADOS DE SUPORTE
   */
  private validateAndConvertId(id: string): string {
    if (!Types.ObjectId.isValid(id))
      throw new Error("Formato de ID de usuário inválido.");
    return id;
  }

  private generateMockPayment(orderId: string): PaymentData {
    return {
      qr_code: "00020101021226870014BR.GOV.BCB.PIX0125adege-fake-key-12345",
      qr_code_base64: "BASE64_MOCK_DATA",
      ticket_url: `https://fake-pay.com/tickets/${orderId}`,
      payment_id: Math.floor(Math.random() * 1000000),
    };
  }

  private emitOrderEvent(order: OrderReadModel, userId: string): void {
    eventBus.publish(EventNames.ORDER_CREATED, {
      orderId: order._id.toString(),
      userId,
      total: order.totalPrice,
    });
  }
}
