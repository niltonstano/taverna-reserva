import { ClientSession, Connection, Types } from "mongoose";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import {
  CheckoutBody,
  IOrderDTO,
  OrderCreateInput,
  OrderStatus,
} from "../types/order.type.js";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "../utils/errors.js";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly connection: Connection,
  ) {}

  /**
   * 🛒 createOrder (Atômico)
   */
  public async createOrder(
    userId: string,
    email: string,
    idempotencyKey: string,
    body: CheckoutBody,
  ): Promise<IOrderDTO> {
    // 1. Check de Idempotência rápido (Fora da transação para performance)
    const existingOrder = await this.orderRepository.findByIdempotencyKey(
      userId,
      idempotencyKey,
    );
    if (existingOrder) return existingOrder;

    // 2. Execução dentro da Transação Gerenciada
    return await this.runTransaction(async (session) => {
      const processedItems = [];
      let totalItemsCents = 0;

      // 3. Processamento de Itens + Lock de Estoque
      for (const item of body.items) {
        const product = await this.productRepository.updateStock(
          item.productId.toString(),
          item.quantity,
          session,
        );

        if (!product) {
          throw new BadRequestError(
            `Estoque insuficiente para o produto: ${item.productId}`,
          );
        }

        const priceCents = this.toCents(product.price);
        const subtotal = priceCents * item.quantity;

        processedItems.push({
          productId: new Types.ObjectId(item.productId.toString()),
          name: product.name,
          quantity: item.quantity,
          priceCents,
          subtotalCents: subtotal,
        });

        totalItemsCents += subtotal;
      }

      const shippingCents = this.toCents(body.shipping.price);

      const orderData: OrderCreateInput = {
        userId: new Types.ObjectId(userId),
        customerEmail: email,
        idempotencyKey,
        items: processedItems,
        totalPriceCents: totalItemsCents + shippingCents,
        shippingPriceCents: shippingCents,
        status: "pending",
        address: body.address,
        zipCode: body.zipCode,
        shipping: {
          ...body.shipping,
          company: body.shipping.company || "TavernaLog",
          priceCents: shippingCents,
        },
      };

      // 4. Persistência do Pedido
      return await this.orderRepository.create(orderData, session);
    });
  }

  /**
   * 🔄 updateOrderStatus
   */
  public async updateOrderStatus(
    id: string,
    newStatus: OrderStatus,
  ): Promise<IOrderDTO> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundError("Pedido não encontrado.");

    if (["delivered", "cancelled"].includes(order.status)) {
      throw new BadRequestError("Pedidos encerrados não podem ser alterados.");
    }

    if (newStatus === "cancelled") {
      await this.rollbackStock(order.items);
    }

    const updated = await this.orderRepository.updateStatus(id, newStatus);
    if (!updated) throw new InternalServerError("Falha ao atualizar status.");

    return updated;
  }

  /**
   * 🛡️ Utilitário para gerenciar Transações (Wrapper)
   */
  private async runTransaction<T>(
    fn: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error; // Repassa para o middleware de erro global
    } finally {
      session.endSession();
    }
  }

  private async rollbackStock(items: any[]) {
    await Promise.all(
      items.map((item) =>
        this.productRepository.updateStock(
          item.productId.toString(),
          -item.quantity,
        ),
      ),
    );
  }

  private toCents(value: number): number {
    return Math.round((value || 0) * 100);
  }

  public async findById(id: string) {
    return this.orderRepository.findById(id);
  }
  public async listAllOrders(page: number, limit: number) {
    return this.orderRepository.findAll(page, limit);
  }
  public async listUserOrders(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }
}
