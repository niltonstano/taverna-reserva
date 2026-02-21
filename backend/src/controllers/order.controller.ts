import { FastifyReply, FastifyRequest } from "fastify";
import { Types } from "mongoose";
import { OrderStatus, VALID_ORDER_STATUSES } from "../domain/order-status.js";
import { UserRole } from "../middlewares/authorization.js";
import { CheckoutService } from "../services/checkout.service.js";
import { OrderService } from "../services/order.service.js";
import { CheckoutBody } from "../types/order.type.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly checkoutService: CheckoutService,
  ) {}

  /**
   * 🛒 Checkout com Idempotência
   * Impede duplicidade de pedidos e cobranças.
   */
  public checkout = async (
    req: FastifyRequest<{ Body: CheckoutBody }>,
    reply: FastifyReply,
  ) => {
    const { id: userId, email } = req.user;
    const idempotencyKey = req.headers["idempotency-key"] as string;

    if (!idempotencyKey) {
      throw new BadRequestError(
        "A chave de idempotência (idempotency-key) é obrigatória para evitar duplicidade.",
      );
    }

    const result = await this.checkoutService.execute(
      userId,
      email,
      idempotencyKey,
      req.body,
    );

    return reply.status(201).send({
      success: true,
      message: "Pedido processado com sucesso.",
      ...result,
    });
  };

  /**
   * 🔍 findById (Proteção Anti-IDOR)
   * Garante que usuários comuns não vejam pedidos alheios.
   */
  public findById = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError("O formato do ID fornecido é inválido.");
    }

    const order = await this.orderService.findById(id);

    // Lógica de Segurança: Admin vê tudo, Customer só o próprio
    const isAdmin = role === UserRole.ADMIN;
    const isOwner = order?.userId.toString() === userId;

    if (!order || (!isAdmin && !isOwner)) {
      // Retornamos 404 para não confirmar a existência do recurso (Enumeração)
      throw new NotFoundError("Pedido não encontrado.");
    }

    return reply.send({
      success: true,
      data: order,
    });
  };

  /**
   * 📋 Listagem de Pedidos do Usuário Logado
   */
  public listMyOrders = async (req: FastifyRequest, reply: FastifyReply) => {
    const orders = await this.orderService.listUserOrders(req.user.id);
    return reply.send({ success: true, data: orders });
  };

  /**
   * 📋 Listagem Geral com Paginação (Admin)
   */
  public findAll = async (
    req: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
    reply: FastifyReply,
  ) => {
    const { page, limit } = req.query;

    const result = await this.orderService.listAllOrders(
      Math.max(1, Number(page) || 1),
      Math.min(100, Number(limit) || 10),
    );

    return reply.send({
      success: true,
      ...result,
    });
  };

  /**
   * 🔄 updateStatus (Proteção de Estado e Validação)
   */
  public updateStatus = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: { status: OrderStatus };
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Validação de formato
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError("ID do pedido inválido.");
    }

    // 2. Fail-Fast: Validação de valor permitido (Zod faria isso, mas aqui blindamos o Controller)
    if (!VALID_ORDER_STATUSES.includes(status)) {
      throw new BadRequestError(`Status '${status}' não é permitido.`);
    }

    const updated = await this.orderService.updateOrderStatus(id, status);

    if (!updated) {
      // Se o pedido não existe ou o status já é o mesmo, retornamos feedback claro
      return reply.send({
        success: true,
        message: "O pedido já está no status desejado ou não foi encontrado.",
        data: null,
      });
    }

    return reply.send({
      success: true,
      message: `Pedido atualizado para ${status}`,
      data: updated,
    });
  };
}
