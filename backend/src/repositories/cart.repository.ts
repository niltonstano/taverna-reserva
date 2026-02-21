import { ClientSession, Types, UpdateQuery } from "mongoose";
import { CartModel, ICartDB } from "../models/cart.model.js";

// 🚚 Interface de População ajustada para suportar o cálculo de frete
export interface ICartPopulated extends Omit<ICartDB, "items"> {
  items: Array<{
    productId: {
      _id: Types.ObjectId;
      name: string;
      price: number;
      stock: number;
      active: boolean;
      image?: string;
      weight: number;
      dimensions: {
        width: number;
        height: number;
        length: number;
      };
    };
    quantity: number;
  }>;
}

export class CartRepository {
  /**
   * 🔍 Busca o carrinho populando os dados do produto.
   * Lean() é usado para performance em operações de leitura.
   */
  async findByUserId(userId: string): Promise<ICartPopulated | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    return await CartModel.findOne({ userId: new Types.ObjectId(userId) })
      .populate("items.productId")
      .lean<ICartPopulated>()
      .exec();
  }

  /**
   * ⚛️ Adição Atômica
   * Previne race conditions no incremento de quantidade e criação de carrinho.
   */
  async addItemAtomic(
    userId: string,
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<boolean> {
    const uId = new Types.ObjectId(userId);
    const pId = new Types.ObjectId(productId);

    // 1. Tenta incrementar a quantidade se o produto já existir no array
    const updateResult = await CartModel.updateOne(
      { userId: uId, "items.productId": pId },
      { $inc: { "items.$.quantity": quantity } },
      { session },
    ).exec();

    // 2. Se não existia, faz o push do novo item (upsert garante a existência do doc)
    if (updateResult.modifiedCount === 0) {
      await CartModel.updateOne(
        { userId: uId },
        { $push: { items: { productId: pId, quantity } } },
        { upsert: true, session },
      ).exec();
    }

    return true;
  }

  /**
   * 🗑️ Remove um item específico usando $pull (Operação atômica)
   */
  async removeItem(userId: string, productId: string): Promise<ICartDB | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(productId))
      return null;

    return await CartModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $pull: { items: { productId: new Types.ObjectId(productId) } },
      } as UpdateQuery<ICartDB>,
      { new: true, lean: true },
    ).exec();
  }

  /**
   * 🧹 Limpa o carrinho mantendo o documento do usuário
   * 🛡️ Resiliente a variações de tipo (ObjectId vs String)
   */
  async clearCart(userId: string, session?: ClientSession): Promise<boolean> {
    if (!Types.ObjectId.isValid(userId)) return false;

    const result = await CartModel.updateOne(
      {
        $or: [{ userId: new Types.ObjectId(userId) }, { userId: userId }],
      },
      {
        $set: {
          items: [],
          totalPriceCents: 0,
          updatedAt: new Date(),
        },
      },
      { session },
    ).exec();

    return result.acknowledged;
  }
}
