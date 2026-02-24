import { FastifyReply, FastifyRequest } from "fastify";
import { Types } from "mongoose";
import { z } from "zod";
import { OrderStatus, VALID_ORDER_STATUSES } from "../domain/order-status.js";
import {
  createOrderSchema,
  orderHeadersSchema,
  orderIdParamSchema,
} from "../schemas/order.schema.js";
import { CheckoutService } from "../services/checkout.service.js";
import { OrderService } from "../services/order.service.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors.js";

/**
 * 🍷 OrderController
 * Orquestrador do ciclo de vida de pedidos com foco em segurança e atomicidade.
 */
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly checkoutService: CheckoutService,
  ) {}

  /**
   * 🛒 Checkout com Blindagem de Idempotência
   * Implementa trava explícita para evitar condições de corrida (Race Conditions).
   */
  public checkout = async (
    req: FastifyRequest<{
      Body: z.infer<typeof createOrderSchema>;
      Headers: z.infer<typeof orderHeadersSchema>;
    }>,
    reply: FastifyReply,
  ) => {
    // 1. Verificação de Identidade (Pre-condition)
    const { id: userId, email } = req.user;
    if (!userId || !email) {
      throw new UnauthorizedError("Identidade do usuário não verificada.");
    }

    // 2. Extração e Validação de Header (Segurança de Unidade)
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) {
      throw new BadRequestError(
        "A chave de idempotência é obrigatória para processar o pedido.",
      );
    }

    // 3. Execução do Serviço Atômico
    const result = await this.checkoutService.execute(
      userId,
      idempotencyKey as string,
      email,
      req.body,
    );

    return reply.status(201).send({
      success: true,
      message: "Pedido processado com sucesso.",
      ...result,
    });
  };

  /**
   * 🔍 findById (Defesa Anti-IDOR e Anti-Enumeração)
   */
  public findById = async (
    req: FastifyRequest<{ Params: z.infer<typeof orderIdParamSchema> }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // Fail-fast: Sanitização de formato MongoDB para evitar injeção
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError("O formato do ID fornecido é inválido.");
    }

    const order = await this.orderService.findById(id);

    // 🛡️ Lógica Anti-IDOR: Se não existe ou não pertence ao usuário (e não é admin), retorna 404.
    const isAdmin = role?.toUpperCase() === "ADMIN";
    const isOwner = order?.userId?.toString() === userId;

    if (!order || (!isAdmin && !isOwner)) {
      throw new NotFoundError("Pedido não encontrado.");
    }

    return reply.send({
      success: true,
      data: order,
    });
  };

  /**
   * 📋 Listagem de Pedidos com Isolamento de Dados
   */
  public listMyOrders = async (req: FastifyRequest, reply: FastifyReply) => {
    const orders = await this.orderService.listUserOrders(req.user.id);
    return reply.send({
      success: true,
      count: orders.length,
      data: orders,
    });
  };

  /**
   * 📋 Painel Administrativo (Listagem Geral Paginada)
   */
  public findAll = async (
    req: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
    reply: FastifyReply,
  ) => {
    // Sanitização de Paginação (Garante que valores negativos ou inválidos virem 1)
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));

    const result = await this.orderService.listAllOrders(page, limit);

    return reply.send({
      success: true,
      ...result,
    });
  };

  /**
   * 🔄 updateStatus
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

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError("ID do pedido inválido.");
    }

    // Runtime Guard contra estados não permitidos
    if (!VALID_ORDER_STATUSES.includes(status)) {
      throw new BadRequestError(
        `O status '${status}' é inválido para a operação.`,
      );
    }

    const updated = await this.orderService.updateOrderStatus(id, status);

    if (!updated) {
      throw new NotFoundError("Pedido não encontrado para atualização.");
    }

    return reply.send({
      success: true,
      message: `Status do pedido atualizado para: ${status}`,
      data: updated,
    });
  };
}
