import { CartModel, ICart } from "../models/cart.model.js";
import { Types, ClientSession, UpdateQuery } from "mongoose";

/**
 * Interface para representar o Carrinho Populado (Read Model)
 * Isso elimina a necessidade de 'any' ou 'unknown' no Service.
 */
export interface ICartPopulated extends Omit<ICart, 'items'> {
  items: Array<{
    productId: {
      _id: Types.ObjectId;
      name: string;
      price: number;
    };
    quantity: number;
  }>;
}

export class CartRepository {
  
  /**
   * Busca o carrinho populando os produtos.
   * ✅ Retorna ICartPopulated para garantir tipagem forte no CheckoutService.
   */
  async findByUserId(userId: string): Promise<ICartPopulated | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    return await CartModel.findOne({ userId: new Types.ObjectId(userId) })
      .populate({
        path: "items.productId",
        select: "_id name price" // Traz apenas o necessário para performance
      })
      .lean<ICartPopulated>()
      .exec();
  }

  /**
   * Atualização Atômica de Itens.
   * ✅ Previne condições de corrida (Race Conditions) no carrinho.
   */
  async updateItemAtomatic(userId: string, productId: string, quantity: number): Promise<ICart | null> {
    const userObjId = new Types.ObjectId(userId);
    const prodObjId = new Types.ObjectId(productId);

    // Tenta incrementar se o produto já existir no array
    let cart = await CartModel.findOneAndUpdate(
      { userId: userObjId, "items.productId": prodObjId },
      { $inc: { "items.$.quantity": quantity } }, 
      { new: true, lean: true }
    ).exec();

    // Se não existir, dá o push do novo item
    if (!cart) {
      cart = await CartModel.findOneAndUpdate(
        { userId: userObjId },
        { $push: { items: { productId: prodObjId, quantity } } },
        { new: true, upsert: true, lean: true }
      ).exec();
    }
    
    return cart as ICart | null;
  }

  /**
   * Atualização genérica com suporte a Sessão (Transações).
   * ✅ Substituído 'any' por UpdateQuery<ICart>.
   */
  async update(userId: string, updateData: UpdateQuery<ICart>, session?: ClientSession): Promise<ICart | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    return await CartModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      updateData,
      { new: true, session, lean: true } 
    ).exec() as ICart | null;
  }

  /**
   * Limpa o carrinho.
   * ✅ Importante: Em produção, costumamos zerar os itens em vez de deletar o documento 
   * para manter as configurações do carrinho do usuário.
   */
  async clearCart(userId: string, session?: ClientSession): Promise<boolean> {
    if (!Types.ObjectId.isValid(userId)) return false;

    const result = await CartModel.updateOne(
      { userId: new Types.ObjectId(userId) }, 
      { $set: { items: [] } },
      { session }
    ).exec();
    
    return result.modifiedCount > 0;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(userId)) return false;
    const result = await CartModel.deleteOne({ userId: new Types.ObjectId(userId) }).exec();
    return result.deletedCount > 0;
  }
}