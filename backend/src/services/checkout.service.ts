/* eslint-disable no-await-in-loop */
import { ClientSession, Connection, Types } from "mongoose";
import { IPaymentProvider } from "../interfaces/payment.interface.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { PopulatedCartItem } from "../types/cart.type.js";
import {
  CheckoutBody,
  CheckoutResult,
  IOrderEntity,
} from "../types/order.type.js";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
} from "../utils/errors.js";

const activeLocks = new Set<string>();

export class CheckoutService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly cartRepo: CartRepository,
    private readonly productRepo: ProductRepository,
    private readonly paymentProvider: IPaymentProvider,
    private readonly connection: Connection,
  ) {}

  public async execute(
    userId: string,
    iKey: string,
    email: string,
    data: CheckoutBody,
  ): Promise<CheckoutResult> {
    await this.acquireLock(iKey);
    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        // 1. Idempotência: Evita duplicidade
        const existingOrder = await this.orderRepo.findByIdempotencyKey(
          userId,
          iKey,
        );
        if (existingOrder) {
          await this.cartRepo.clearCart(userId, session);
          return await this.buildResponse(existingOrder, email);
        }

        // 2. Resolução de itens (Carrinho ou Payload)
        const cartItems = await this.resolveCartItems(userId, data.items);

        // 3. Estoque e Precificação (Backend Authoritative)
        const { orderItems, itemsTotalCents } =
          await this.processStockAndPricing(cartItems, session);

        // 4. Validação de Integridade (Anti-fraude de preço)
        this.validateFinancialIntegrity(data, itemsTotalCents);

        // 5. Persistência da Ordem
        const orderData = this.mapOrderData(
          userId,
          email,
          iKey,
          data,
          orderItems,
          itemsTotalCents,
        );
        const order = await this.orderRepo.create(orderData, session);

        // 6. Cleanup do Carrinho
        await this.cartRepo.clearCart(userId, session);

        return await this.buildResponse(order, email);
      });
    } finally {
      activeLocks.delete(iKey);
      await session.endSession();
    }
  }

  private async resolveCartItems(
    userId: string,
    payloadItems?: CheckoutBody["items"],
  ): Promise<PopulatedCartItem[]> {
    const dbCart = await this.cartRepo.findByUserId(userId);
    if (dbCart?.items?.length)
      return dbCart.items as unknown as PopulatedCartItem[];

    if (payloadItems?.length) {
      return payloadItems.map((item) => ({
        productId: {
          _id: new Types.ObjectId(item.productId),
          name: "",
          price: 0,
          stock: 0,
          active: true,
          weight: 0,
          dimensions: { length: 0, width: 0, height: 0 },
        } as unknown as PopulatedCartItem["productId"],
        quantity: item.quantity,
      })) as PopulatedCartItem[];
    }

    throw new BadRequestError(
      "Nenhum item encontrado para processar o checkout.",
    );
  }

  private async processStockAndPricing(
    cartItems: PopulatedCartItem[],
    session: ClientSession,
  ) {
    let itemsTotalCents = 0;
    const orderItems: IOrderEntity["items"] = [];

    for (const item of cartItems) {
      const productId =
        item.productId instanceof Types.ObjectId
          ? item.productId
          : (item.productId as unknown as { _id: Types.ObjectId })._id;

      const product = await this.productRepo.updateStock(
        productId.toHexString(),
        item.quantity,
        session,
      );

      if (!product)
        throw new BadRequestError(`Estoque insuficiente: ${productId}`);

      const priceCents = Math.round(product.price * 100);
      const subtotalCents = priceCents * item.quantity;
      itemsTotalCents += subtotalCents;

      orderItems.push({
        productId,
        name: product.name,
        priceCents,
        quantity: item.quantity,
        subtotalCents,
      });
    }
    return { orderItems, itemsTotalCents };
  }

  private validateFinancialIntegrity(
    data: CheckoutBody,
    backendTotalCents: number,
  ): void {
    const shippingCents = Math.round(data.shipping.price * 100);
    const expectedTotal = backendTotalCents + shippingCents;
    const receivedTotal = Math.round(data.total * 100);

    if (Math.abs(expectedTotal - receivedTotal) > 1) {
      throw new BadRequestError("Divergência de valores detectada.");
    }
  }

  private async buildResponse(
    order: any,
    email: string,
  ): Promise<CheckoutResult> {
    const orderId = order._id?.toString() || order.id;
    if (!orderId)
      throw new InternalServerError("Falha ao identificar o pedido.");

    const paymentData = await this.paymentProvider.generatePix(
      orderId,
      Number(order.totalPriceCents),
      email,
    );

    return {
      order: order as IOrderEntity & { _id: Types.ObjectId },
      payment_data: paymentData,
    };
  }

  private async acquireLock(iKey: string): Promise<void> {
    if (activeLocks.has(iKey))
      throw new ConflictError("Processamento em curso.");

    let attempts = 0;

    while (this.connection.readyState !== 1 && attempts < 10) {
      if (
        this.connection.readyState === 0 ||
        this.connection.readyState === 3
      ) {
        throw new InternalServerError("Banco de dados offline.");
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }

    if (this.connection.readyState !== 1)
      throw new InternalServerError("Banco indisponível.");
    activeLocks.add(iKey);
  }

  private mapOrderData(
    userId: string,
    email: string,
    iKey: string,
    data: CheckoutBody,
    items: IOrderEntity["items"],
    total: number,
  ): IOrderEntity {
    const shippingCents = Math.round(data.shipping.price * 100);
    return {
      userId: new Types.ObjectId(userId),
      customerEmail: email,
      idempotencyKey: iKey,
      items,
      totalPriceCents: total + shippingCents,
      shippingPriceCents: shippingCents,
      status: "pending",
      address: data.address,
      zipCode: data.zipCode,
      shipping: {
        service: data.shipping.service,
        company: data.shipping.company || "Transportadora Padrão",
        priceCents: shippingCents,
        deadline: data.shipping.deadline,
      },
    };
  }
}
