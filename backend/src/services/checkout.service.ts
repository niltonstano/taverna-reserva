/* eslint-disable no-await-in-loop */
import { ClientSession, Connection, Types } from "mongoose";
import { IPaymentProvider } from "../interfaces/payment.interface.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { PopulatedCartItem } from "../types/cart.type.js";
import { CheckoutBody, CheckoutResult } from "../types/order.type.js";
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
    this.validateSystemState(iKey);
    activeLocks.add(iKey);

    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        // 1. Verificação de Idempotência (Evita pedidos duplicados)
        const existingOrder = await this.orderRepo.findByIdempotencyKey(
          userId,
          iKey,
        );
        if (existingOrder) {
          await this.cartRepo.clearCart(userId, session);
          return this.formatSuccessResponse(existingOrder, email);
        }

        /**
         * 🚀 ESTRATÉGIA HÍBRIDA DE CARRINHO
         * Se o banco está vazio (Admin ou erro de sync), usamos os itens do Payload.
         * Isso evita o erro "Seu carrinho está vazio" quando o dado está no Frontend.
         */
        let cartItems: PopulatedCartItem[] = [];
        const dbCart = await this.cartRepo.findByUserId(userId);

        if (dbCart?.items?.length) {
          cartItems = dbCart.items as unknown as PopulatedCartItem[];
        } else if (data.items && data.items.length > 0) {
          // Normaliza os itens do payload para o formato esperado pelo prepareStockAndItems
          cartItems = data.items.map((item) => ({
            productId: { _id: item.productId } as any,
            quantity: item.quantity,
          }));
        }

        if (cartItems.length === 0) {
          throw new BadRequestError(
            "Seu carrinho está vazio no banco e no payload.",
          );
        }

        // 2. Validação de Estoque e Cálculo de Preços Reais (Backend-side)
        const { orderItems, itemsTotalCents } = await this.prepareStockAndItems(
          cartItems,
          session,
        );

        // 3. Validação de Integridade Financeira
        const shippingCents = Math.round(data.shipping.price * 100);
        const expectedTotalCents = itemsTotalCents + shippingCents;
        const sentTotalCents = Math.round(data.total * 100);

        // Tolerância de 1 centavo para arredondamentos de JS
        if (Math.abs(expectedTotalCents - sentTotalCents) > 1) {
          throw new BadRequestError(
            "Divergência de valores detectada entre Frontend e Backend.",
          );
        }

        // 4. Persistência do Pedido
        const savedOrder = await this.orderRepo.create(
          {
            userId: new Types.ObjectId(userId),
            customerEmail: email,
            idempotencyKey: iKey,
            items: orderItems,
            totalPriceCents: expectedTotalCents,
            shippingPriceCents: shippingCents,
            status: "pending",
            address: data.address,
            zipCode: data.zipCode,
            shipping: {
              service: data.shipping.service,
              company: data.shipping.company || "Transportadora Standard",
              priceCents: shippingCents,
              deadline: data.shipping.deadline,
            },
          },
          session,
        );

        // 5. Limpeza de rastro
        await this.cartRepo.clearCart(userId, session);

        return this.formatSuccessResponse(savedOrder, email);
      });
    } finally {
      activeLocks.delete(iKey);
      await session.endSession();
    }
  }

  private async prepareStockAndItems(
    cartItems: PopulatedCartItem[],
    session: ClientSession,
  ) {
    let itemsTotalCents = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const pId = item.productId?._id || (item.productId as any);
      if (!pId)
        throw new BadRequestError("ID do produto inválido no processamento.");

      // O updateStock garante que o estoque diminua atomicamente
      const product = await this.productRepo.updateStock(
        pId,
        item.quantity,
        session,
      );

      if (!product) {
        throw new BadRequestError(
          `Estoque insuficiente ou produto inexistente: ${pId}`,
        );
      }

      const priceCents = Math.round(product.price * 100);
      const subtotalCents = priceCents * item.quantity;
      itemsTotalCents += subtotalCents;

      orderItems.push({
        productId: new Types.ObjectId(product._id),
        name: product.name,
        priceCents,
        quantity: item.quantity,
        subtotalCents,
      });
    }
    return { orderItems, itemsTotalCents };
  }

  private formatSuccessResponse(order: any, email: string): CheckoutResult {
    return {
      order,
      payment_data: {
        qr_code: "WHATSAPP_REDIRECT",
        qr_code_base64: "",
        ticket_url: this.paymentProvider.generatePaymentLink(
          order._id?.toString() || order.id,
          Number(order.totalPriceCents),
          email,
        ),
        payment_id: Date.now(),
      },
    };
  }

  private validateSystemState(iKey: string): void {
    if (activeLocks.has(iKey))
      throw new ConflictError("Processamento duplicado em curso.");
    if (this.connection.readyState !== 1)
      throw new InternalServerError("Banco de dados offline ou instável.");
  }
}
