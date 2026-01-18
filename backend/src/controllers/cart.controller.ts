import { FastifyReply, FastifyRequest } from "fastify";
import { AddItemBody, RemoveItemParams } from "../routes/cart.routes.js";
import { CartService } from "../services/cart.service.js";

interface ApiError extends Error {
  statusCode?: number;
}

export class CartController {
  constructor(private readonly cartService: CartService) {}

  getCart = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const cart = await this.cartService.getCartByUserId(request.user.id);
      return void reply.status(200).send(cart);
    } catch (error) {
      this.handleError(request, reply, error);
    }
  };

  addItem = async (
    request: FastifyRequest<{ Body: AddItemBody }>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const { productId, quantity } = request.body;
      const cart = await this.cartService.addItem(
        request.user.id,
        productId,
        quantity
      );
      return void reply
        .status(201)
        .send({ success: true, message: "Item adicionado", cart });
    } catch (error) {
      this.handleError(request, reply, error);
    }
  };

  removeItem = async (
    request: FastifyRequest<{ Params: RemoveItemParams }>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const cart = await this.cartService.removeItem(
        request.user.id,
        request.params.productId
      );
      return void reply
        .status(200)
        .send({ success: true, message: "Item removido", cart });
    } catch (error) {
      this.handleError(request, reply, error);
    }
  };

  clearCart = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      await this.cartService.clearCart(request.user.id);
      return void reply
        .status(200)
        .send({ success: true, message: "Carrinho esvaziado" });
    } catch (error) {
      this.handleError(request, reply, error);
    }
  };

  private handleError(
    request: FastifyRequest,
    reply: FastifyReply,
    error: unknown
  ): void {
    request.log.error(error);
    const statusCode = (error as ApiError)?.statusCode || 400;
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return void reply.status(statusCode).send({ success: false, message });
  }
}
