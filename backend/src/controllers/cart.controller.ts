import { FastifyReply, FastifyRequest } from "fastify";
import { Types } from "mongoose";
import { CartService } from "../services/cart.service.js";
import {
  CartItemBody,
  CartParams,
  ICartController,
} from "../types/cart.type.js";
import { UnauthorizedError } from "../utils/errors.js";

/**
 * CartController
 * Gerencia as operações do carrinho de compras.
 * Os erros são capturados pelo Global Error Handler.
 */
export class CartController implements ICartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Valida se o ID do usuário vindo do token é um ObjectId válido.
   */
  private validateUser(userId: string): void {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedError("Usuário não autenticado ou ID inválido");
    }
  }

  getCart = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.id;
    this.validateUser(userId);

    const cart = await this.cartService.getCartByUserId(userId);

    return reply.status(200).send({
      success: true,
      data: cart,
    });
  };

  addItem = async (
    request: FastifyRequest<{ Body: CartItemBody }>,
    reply: FastifyReply,
  ) => {
    const userId = request.user.id;
    this.validateUser(userId);

    const { productId, quantity } = request.body;
    const cart = await this.cartService.addItem(userId, productId, quantity);

    return reply.status(200).send({
      success: true,
      message: "Carrinho atualizado.",
      data: cart,
    });
  };

  removeItem = async (
    request: FastifyRequest<{ Params: CartParams }>,
    reply: FastifyReply,
  ) => {
    const userId = request.user.id;
    this.validateUser(userId);

    const { productId } = request.params;
    const cart = await this.cartService.removeItem(userId, productId);

    return reply.status(200).send({
      success: true,
      message: "Item removido.",
      data: cart,
    });
  };

  clearCart = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.id;
    this.validateUser(userId);

    await this.cartService.clearCart(userId);

    return reply.status(200).send({
      success: true,
      message: "Carrinho esvaziado.",
    });
  };
}

export default CartController;
