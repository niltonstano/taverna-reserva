import { FastifyReply, FastifyRequest } from "fastify";
import { CheckoutService } from "../services/checkout.service.js";
import { OrderService } from "../services/order.service.js";
import { OrderReadModel, OrderStatus } from "../types/order.type.js";

/**
 * Interface estrita para erros de chave duplicada do MongoDB (E11000)
 */
interface MongoDuplicateKeyError extends Error {
  code: number;
}

export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly checkoutService: CheckoutService
  ) {}

  /**
   * ✅ LISTAR TUDO (ADMIN)
   * Usado na tela de logística/gestão para ver pedidos de todos os usuários.
   */
  public findAll = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      // Extrai paginação da querystring (enviada pelo AdminOrders.tsx)
      const { page = 1, limit = 10 } = request.query as {
        page?: number;
        limit?: number;
      };

      const orders = await this.orderService.listAllOrders(page, limit);

      return void reply.send({
        success: true,
        data: orders,
      });
    } catch (error: unknown) {
      request.log.error(error, "ERRO_ADMIN_LISTAR_PEDIDOS");
      return void reply.status(500).send({
        success: false,
        message: "Erro ao carregar lista global de pedidos.",
      });
    }
  };

  /**
   * ✅ CHECKOUT (CLIENTE)
   * Processa a criação do pedido com proteção de Idempotência.
   * Garante que o cliente não seja cobrado duas vezes por falhas de rede.
   */
  public checkout = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const { id: userId, email } = request.user;
      const idempotencyKey = request.headers["idempotency-key"];

      if (!idempotencyKey || typeof idempotencyKey !== "string") {
        return void reply.status(400).send({
          success: false,
          message:
            "O cabeçalho 'idempotency-key' é obrigatório para sua segurança.",
        });
      }

      const result = await this.checkoutService.execute(
        userId,
        idempotencyKey,
        email
      );

      return void reply.status(201).send({
        success: true,
        order: result.order,
        payment_data: result.payment_data,
      });
    } catch (error: unknown) {
      // Tratamento específico para duplicidade (Idempotência)
      if (this.isMongoDuplicateKeyError(error)) {
        request.log.warn(
          { userId: request.user.id },
          "BLOQUEIO_DE_PEDIDO_DUPLICADO"
        );
        return void reply.status(409).send({
          success: false,
          message:
            "Este pedido já foi processado. Verifique seu histórico de compras.",
        });
      }

      request.log.error({ err: error }, "ERRO_NO_CHECKOUT");
      return void reply.status(400).send({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao processar checkout",
      });
    }
  };

  /**
   * ✅ MEUS PEDIDOS (CLIENTE)
   * Lista histórico com mapeamento defensivo (Safe Mapping).
   * Previne erros de 'undefined' se o banco retornar dados parciais.
   */
  public listMyOrders = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const userId = request.user.id;
      const orders = (await this.orderService.listUserOrders(
        userId
      )) as unknown as OrderReadModel[];

      const formattedOrders = orders.map((order: OrderReadModel) => ({
        _id: order._id?.toString() || "",
        totalPrice: Number(order.totalPrice || 0),
        status: order.status || "pending",
        items: order.items || [],
        createdAt:
          order.createdAt instanceof Date
            ? order.createdAt.toISOString()
            : new Date().toISOString(),
      }));

      return void reply.send({
        success: true,
        data: formattedOrders,
      });
    } catch (error: unknown) {
      request.log.error(
        { err: error, userId: request.user.id },
        "FALHA_LISTAGEM_PEDIDOS"
      );
      return void reply.status(500).send({
        success: false,
        message: "Não conseguimos carregar seu histórico no momento.",
      });
    }
  };

  /**
   * ✅ ATUALIZAR STATUS (ADMIN)
   * Apenas para uso administrativo.
   */
  public updateStatus = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: OrderStatus };

      const order = await this.orderService.updateOrderStatus(id, status);

      return void reply.send({
        success: true,
        message: `Status do pedido atualizado para: ${status}`,
        order,
      });
    } catch (error: unknown) {
      request.log.error(error);
      return void reply.status(400).send({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao atualizar status",
      });
    }
  };

  /**
   * ✅ HELPER PRIVADO: Validação de Erro Mongo
   */
  private isMongoDuplicateKeyError(
    error: unknown
  ): error is MongoDuplicateKeyError {
    return (
      error instanceof Error &&
      "code" in error &&
      (error as MongoDuplicateKeyError).code === 11000
    );
  }
}
