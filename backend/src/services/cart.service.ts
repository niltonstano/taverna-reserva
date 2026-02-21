import { Types } from "mongoose";
import { CartRepository } from "../repositories/cart.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { CartResponse, PopulatedCartItem } from "../types/cart.type.js";
import { BadRequestError } from "../utils/errors.js";

/**
 * Service responsável pela lógica de negócio do carrinho de compras.
 * Segue o princípio de responsabilidade única (SRP).
 */
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  /**
   * Adiciona um item ao carrinho com validações rigorosas de estoque e status.
   */
  public async addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartResponse> {
    const uId = this.validateId(userId);
    const pId = this.validateId(productId);

    if (quantity <= 0) {
      throw new BadRequestError("A quantidade deve ser maior que zero.");
    }

    const product = await this.productRepository.findById(pId);

    // Validação de Disponibilidade: Não basta o produto existir, ele deve estar ativo.
    if (!product || product.active === false) {
      throw new BadRequestError("PRODUTO_INDISPONIVEL");
    }

    // Validação de Estoque
    if (product.stock < quantity) {
      throw new BadRequestError("ESTOQUE_INSUFICIENTE");
    }

    // Operação Atômica: Evita problemas de concorrência no banco
    await this.cartRepository.addItemAtomic(uId, pId, quantity);

    return this.getCartByUserId(uId);
  }

  /**
   * Remove um produto específico do carrinho do usuário.
   */
  public async removeItem(
    userId: string,
    productId: string,
  ): Promise<CartResponse> {
    const uId = this.validateId(userId);
    const pId = this.validateId(productId);

    await this.cartRepository.removeItem(uId, pId);

    return this.getCartByUserId(uId);
  }

  /**
   * Esvazia o carrinho completamente.
   */
  public async clearCart(userId: string): Promise<void> {
    const uId = this.validateId(userId);
    await this.cartRepository.clearCart(uId);
  }

  /**
   * Recupera o carrinho populado e calcula os totais em tempo real.
   */
  public async getCartByUserId(userId: string): Promise<CartResponse> {
    const uId = this.validateId(userId);
    const cart = await this.cartRepository.findByUserId(uId);

    if (!cart || !cart.items?.length) {
      return this.emptyResponse(uId);
    }

    // Mapeamento seguro de dados para evitar vazamento de campos internos do banco
    const validItems: PopulatedCartItem[] = cart.items.map((item: any) =>
      this.formatCartItem(item),
    );

    const { totalPrice, totalItems } = this.calculateTotals(validItems);

    return {
      _id: cart._id.toString(),
      userId: uId,
      items: validItems,
      totalPrice,
      totalItems,
      updatedAt: new Date(cart.updatedAt).toISOString(),
    };
  }

  /**
   * Valida se a string é um ObjectId válido do MongoDB.
   */
  private validateId(id: string): string {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestError("ID_INVALIDO");
    }
    return id;
  }

  /**
   * Formata o item vindo do repositório para o DTO de resposta.
   */
  private formatCartItem(item: any): PopulatedCartItem {
    return {
      productId: {
        _id: String(item.productId._id),
        name: String(item.productId.name),
        price: Number(item.productId.price),
        stock: Number(item.productId.stock),
        active: Boolean(item.productId.active),
        image: String(item.productId.image_url || ""),
        weight: Number(item.productId.weight) || 0.5,
        dimensions: {
          width: Number(item.productId.dimensions?.width) || 11,
          height: Number(item.productId.dimensions?.height) || 17,
          length: Number(item.productId.dimensions?.length) || 11,
        },
      },
      quantity: item.quantity,
    };
  }

  /**
   * Centraliza o cálculo de valores para garantir precisão decimal.
   */
  private calculateTotals(items: PopulatedCartItem[]) {
    const totals = items.reduce(
      (acc, item) => {
        const itemPrice = Number(item.productId.price);
        acc.amountCents += Math.round(itemPrice * 100) * item.quantity;
        acc.qty += item.quantity;
        return acc;
      },
      { amountCents: 0, qty: 0 },
    );

    return {
      totalPrice: (totals.amountCents / 100).toFixed(2),
      totalItems: totals.qty,
    };
  }

  /**
   * Retorno padrão para carrinhos inexistentes ou limpos.
   */
  private emptyResponse(userId: string): CartResponse {
    return {
      _id: "",
      userId,
      items: [],
      totalItems: 0,
      totalPrice: "0.00",
      updatedAt: new Date().toISOString(),
    };
  }
}
