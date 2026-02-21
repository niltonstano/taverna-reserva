import { Connection, Types } from "mongoose";
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
   * 🛒 createOrder (Blindado com Transações)
   */
  public async createOrder(
    userId: string,
    email: string,
    idempotencyKey: string,
    body: CheckoutBody,
  ): Promise<IOrderDTO> {
    // 1. Check de Idempotência rápido (evita abrir transação à toa)
    const existingOrder = await this.orderRepository.findByIdempotencyKey(
      userId,
      idempotencyKey,
    );
    if (existingOrder) return existingOrder;

    // 2. Início da Transação
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const processedItems = [];
      let totalItemsCents = 0;

      // 3. Processamento de Itens + Lock de Estoque
      for (const item of body.items) {
        const product = await this.productRepository.updateStock(
          item.productId.toString(),
          item.quantity,
          session, // Passamos a session para o repositório
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

      // 4. Criação do Pedido dentro da transação
      const newOrder = await this.orderRepository.create(orderData, session);

      // 5. Finaliza com sucesso
      await session.commitTransaction();
      return newOrder;
    } catch (error) {
      // 6. Deu ruim? Rollback automático: o estoque dos produtos volta ao normal
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * 🔄 updateOrderStatus (Com rollback de estoque em cancelamento)
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

    // Se o novo status for cancelado, devolve o estoque
    if (newStatus === "cancelled") {
      await this.rollbackStock(order.items);
    }

    // O updateStatus no repositório DEVE usar { status: { $ne: newStatus } } para ser atômico
    const updated = await this.orderRepository.updateStatus(id, newStatus);
    if (!updated) throw new InternalServerError("Falha ao atualizar status.");

    return updated;
  }

  private async rollbackStock(items: any[]) {
    const tasks = items.map((item) =>
      this.productRepository.updateStock(
        item.productId.toString(),
        -item.quantity,
      ),
    );
    await Promise.all(tasks);
  }

  private toCents(value: number): number {
    return Math.round((value || 0) * 100);
  }

  // Métodos de listagem simples
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
