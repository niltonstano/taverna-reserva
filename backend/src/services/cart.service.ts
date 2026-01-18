import { CartRepository } from "../repositories/cart.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { IProduct } from "../models/product.model.js";
import { Types } from "mongoose";

/**
 * Interface rigorosa para o Produto populado dentro do Carrinho.
 * Extraímos os campos necessários diretamente de IProduct para manter o S.O.L.I.D.
 */
export interface CartProductData extends Pick<IProduct, "name" | "price" | "stock" | "active"> {
  _id: Types.ObjectId | string;
}

export interface PopulatedCartItem {
  productId: CartProductData;
  quantity: number;
}

export interface CartResponse {
  _id: string;
  userId: string;
  items: PopulatedCartItem[];
  totalItems: number;
  totalPrice: string;
  updatedAt: string;
}

export class CartService {
  private readonly cartRepository: CartRepository;
  private readonly productRepository: ProductRepository;

  constructor(cartRepository?: CartRepository, productRepository?: ProductRepository) {
    this.cartRepository = cartRepository || new CartRepository();
    this.productRepository = productRepository || new ProductRepository();
  }

  public async getCartByUserId(userId: string): Promise<CartResponse> {
    const cleanUserId = this.validateAndConvertId(userId);
    const cart = await this.cartRepository.findByUserId(cleanUserId);

    if (!cart || !cart.items || cart.items.length === 0) {
      return this.emptyResponse(cleanUserId);
    }

    // Filtra e mapeia os itens garantindo que productId está populado
    const validItems: PopulatedCartItem[] = (cart.items as unknown as PopulatedCartItem[])
      .filter(item => item.productId && typeof item.productId === 'object');

    const { totalPrice, totalItems } = this.calculateTotals(validItems);

    return {
      _id: cart._id.toString(),
      userId: cleanUserId,
      items: validItems,
      totalItems,
      totalPrice,
      updatedAt: cart.updatedAt ? new Date(cart.updatedAt as Date).toISOString() : new Date().toISOString()
    };
  }

  public async addItem(userId: string, productId: string, quantity: number): Promise<CartResponse> {
    const cleanUserId = this.validateAndConvertId(userId);
    const cleanProductId = this.validateAndConvertId(productId);
    
    const qty = Math.floor(quantity);
    if (qty <= 0) throw new Error("A quantidade deve ser um número positivo.");

    const product = await this.productRepository.findById(cleanProductId);
    if (!product) throw new Error("Produto não encontrado.");
    
    if (product.active === false) throw new Error("Este produto está inativo.");
    if (product.stock < qty) throw new Error(`Estoque insuficiente. Disponível: ${product.stock}`);

    const cart = await this.cartRepository.updateItemAtomatic(cleanUserId, cleanProductId, qty);
    if (!cart) throw new Error("Erro crítico: falha ao atualizar persistência do carrinho.");

    return this.getCartByUserId(cleanUserId);
  }

  public async removeItem(userId: string, productId: string): Promise<CartResponse> {
    const cleanUserId = this.validateAndConvertId(userId);
    const cleanProductId = this.validateAndConvertId(productId);

    await this.cartRepository.update(cleanUserId, { 
      $pull: { items: { productId: new Types.ObjectId(cleanProductId) } } 
    });
    
    return this.getCartByUserId(cleanUserId);
  }

  public async clearCart(userId: string): Promise<void> {
    const cleanUserId = this.validateAndConvertId(userId);
    await this.cartRepository.clearCart(cleanUserId);
  }

  /**
   * Sanitização e conversão segura de IDs.
   * Substitui o 'any' por uma união de tipos prováveis.
   */
  private validateAndConvertId(id: string | Types.ObjectId | Uint8Array | unknown): string {
    if (!id) throw new Error("ID não fornecido.");

    let stringId: string;

    if (id instanceof Types.ObjectId) {
      stringId = id.toHexString();
    } else if (typeof id === 'string') {
      stringId = id;
    } else {
      stringId = String(id);
    }
    
    if (!Types.ObjectId.isValid(stringId) || stringId === "[object Object]") {
      throw new Error(`Tentativa de uso de ID inválido: ${stringId}`);
    }
    
    return stringId;
  }

  private calculateTotals(items: PopulatedCartItem[]) {
    const totals = items.reduce(
      (acc, item) => {
        const price = Number(item.productId.price) || 0;
        const q = Number(item.quantity) || 0;
        acc.totalPrice += price * q;
        acc.totalItems += q;
        return acc;
      },
      { totalPrice: 0, totalItems: 0 }
    );

    return {
      totalPrice: totals.totalPrice.toFixed(2),
      totalItems: totals.totalItems
    };
  }

  private emptyResponse(userId: string): CartResponse {
    return {
      _id: "",
      userId,
      items: [],
      totalItems: 0,
      totalPrice: "0.00",
      updatedAt: new Date().toISOString()
    };
  }
}