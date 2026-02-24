import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  CheckoutBodySchema,
  CheckoutHeadersSchema,
} from "../schemas/checkout.schema.js";
import { CheckoutService } from "../services/checkout.service.js";
import { UnauthorizedError } from "../utils/errors.js";

/**
 * 🚀 CheckoutController
 * Responsável pela orquestração da finalização da compra.
 */
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * handle
   * O uso de Generics no FastifyRequest elimina a necessidade de safeParse manual.
   */
  public handle = async (
    request: FastifyRequest<{
      Body: z.infer<typeof CheckoutBodySchema>;
      Headers: z.infer<typeof CheckoutHeadersSchema>;
    }>,
    reply: FastifyReply,
  ) => {
    // 1. Contexto de Usuário (Segurança via JWT)
    const userId = request.user?.id;
    const email = request.user?.email;

    if (!userId || !email) {
      throw new UnauthorizedError("Usuário não autenticado.");
    }

    /**
     * 💡 NOTA DE PRODUÇÃO:
     * O 'idempotency-key' e o 'body' já chegam aqui validados
     * pelo Fastify + ZodTypeProvider. Se estivessem errados,
     * o Fastify teria retornado 400 automaticamente.
     */
    const idempotencyKey = request.headers["idempotency-key"];

    // 2. Execução do Serviço (Atomicidade)
    // Passamos diretamente request.body pois ele já está tipado e validado.
    const result = await this.checkoutService.execute(
      userId,
      idempotencyKey,
      email,
      request.body,
    );

    // 3. Resposta de Sucesso (Flat structure para facilitar o consumo no Front)
    return reply.status(201).send({
      success: true,
      message: "Pedido gerado com sucesso.",
      ...result,
    });
  };
}
