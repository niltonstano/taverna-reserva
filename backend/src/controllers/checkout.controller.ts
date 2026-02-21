import { FastifyReply, FastifyRequest } from "fastify";
import {
  CheckoutBodySchema,
  CheckoutHeadersSchema,
} from "../schemas/checkout.schema.js";
import { CheckoutService } from "../services/checkout.service.js";
import { UnauthorizedError } from "../utils/errors.js";

export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  public handle = async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. Contexto de Usuário (Extraído do JWT/Session)
    const userId = request.user?.id;
    const email = request.user?.email;

    if (!userId || !email) {
      throw new UnauthorizedError("Usuário não autenticado.");
    }

    // 2. Validação de Cabeçalhos (Idempotency-Key UUID)
    const headerValidation = CheckoutHeadersSchema.safeParse(request.headers);

    if (!headerValidation.success) {
      return reply.status(400).send({
        success: false,
        error: "Cabeçalho inválido",
        details: headerValidation.error.format(),
      });
    }

    const idempotencyKey = headerValidation.data["idempotency-key"];

    // 3. Validação do Corpo (Dados do Pedido + Frete)
    const bodyValidation = CheckoutBodySchema.safeParse(request.body);

    if (!bodyValidation.success) {
      return reply.status(400).send({
        success: false,
        error: "Dados do checkout inválidos",
        details: bodyValidation.error.format(),
      });
    }

    // 4. Execução do Serviço
    // O result contém: { order: IOrderDTO, payment_data: IPaymentData }
    const result = await this.checkoutService.execute(
      userId,
      idempotencyKey,
      email,
      bodyValidation.data,
    );

    // 5. Resposta de Sucesso
    // o spread (...result) para que 'order' e 'payment_data'
    // fiquem no primeiro nível da resposta, como o teste exige.
    return reply.status(201).send({
      success: true,
      message: "Pedido gerado com sucesso.",
      ...result,
    });
  };
}
