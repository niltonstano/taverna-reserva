import { FastifyReply, FastifyRequest } from "fastify";
import { ShippingService } from "../services/shipping.service.js";
import { CalculateShippingBody } from "../types/shipping.js";

/**
 * ShippingController
 * Gerencia cálculos de frete e integrações logísticas.
 */
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  calculateCartShipping = async (
    request: FastifyRequest<{ Body: CalculateShippingBody }>,
    reply: FastifyReply,
  ) => {
    const { cep, items } = request.body;

    // Se request.user existir (via JWT), usa o ID, senão vira "guest"
    const userId = request.user?.id || "guest";

    const quotes = await this.shippingService.calculateShipping(
      userId,
      cep,
      items,
    );

    return reply.status(200).send({
      success: true,
      data: {
        cep_destino: cep.replace(/\D/g, ""),
        quotes,
      },
    });
  };
}

export default ShippingController;
