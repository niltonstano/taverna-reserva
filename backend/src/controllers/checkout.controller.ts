import { FastifyReply, FastifyRequest } from "fastify";
import { Types } from "mongoose";
import { z } from "zod";
import { CheckoutService } from "../services/checkout.service.js";

/**
 * ✅ SCHEMA DE VALIDAÇÃO (ZOD)
 * Garante que o corpo da requisição e os headers estejam corretos
 * antes mesmo de entrar na lógica de negócio.
 */
export const CheckoutBodySchema = z.object({
  email: z.string().email("E-mail inválido").trim().toLowerCase(),
});

export const CheckoutHeadersSchema = z
  .object({
    "idempotency-key": z
      .string({
        required_error:
          "Chave de idempotência é obrigatória para evitar cobranças duplicadas.",
      })
      .min(1),
  })
  .passthrough(); // ✅ Essencial: permite que outros headers (Host, User-Agent) passem

export interface CheckoutRoute {
  Body: z.infer<typeof CheckoutBodySchema>;
  Headers: z.infer<typeof CheckoutHeadersSchema>;
}

export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * ✅ HANDLER PRINCIPAL
   * Gerencia o fluxo de checkout com proteção de idempotência.
   */
  public handle = async (
    request: FastifyRequest<CheckoutRoute>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      // 1. Verificação de Autenticação Segura
      const user = request.user as { id: string } | undefined;
      const userId = user?.id;

      if (!userId || !Types.ObjectId.isValid(userId)) {
        return void reply.status(401).send({
          success: false,
          message: "Sessão inválida. Por favor, realize o login novamente.",
        });
      }

      // 2. Extração de dados validados
      const { email } = request.body;
      const idempotencyKey = request.headers["idempotency-key"] as string;

      // 3. Execução do Serviço (Regras de Negócio, Criação de Pedido e Pagamento)
      const result = await this.checkoutService.execute(
        userId,
        idempotencyKey,
        email
      );

      // 4. Sucesso: Pedido criado
      return void reply.status(201).send({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      /**
       * 🛡️ TRATAMENTO DE ERROS DE PRODUÇÃO
       */

      // Caso 1: Erro de Idempotência (MongoDB Duplicate Key - Código 11000)
      if (this.isMongoDuplicateKeyError(error)) {
        request.log.warn(
          { userId: request.user?.id },
          "TENTATIVA_DE_CHECKOUT_DUPLICADO_BLOQUEADA"
        );

        return void reply.status(409).send({
          success: false,
          message:
            "Este pedido já está sendo processado. Verifique seu histórico de compras.",
        });
      }

      // Caso 2: Erros genéricos ou de negócio
      request.log.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno no processo de checkout";

      return void reply.status(400).send({
        success: false,
        message,
      });
    }
  };

  /**
   * ✅ HELPER PRIVADO: Identifica erro de chave duplicada no MongoDB
   */
  private isMongoDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as any).code === 11000
    );
  }
}
