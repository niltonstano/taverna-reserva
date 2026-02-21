import { FastifyReply, FastifyRequest } from "fastify";
import logger from "../plugins/logger.js";
import { CustomerService } from "../services/customer.service.js";

export class CustomerController {
  constructor(private readonly customerService = new CustomerService()) {}

  public async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const customer = await this.customerService.getById(id);

    return reply.status(200).send({
      success: true,
      data: customer,
    });
  }

  public async listAll(_request: FastifyRequest, reply: FastifyReply) {
    const users = await this.customerService.listAll();
    return reply.status(200).send(users);
  }

  public async getAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { page?: number; limit?: number };
    const result = await this.customerService.getAll(query.page, query.limit);
    return reply.status(200).send(result);
  }

  public async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    logger.warn(
      { customerId: id, adminId: request.user?.id },
      "Executando deleção de cliente",
    );

    await this.customerService.delete(id);
    return reply.status(204).send();
  }

  public async logout(_request: FastifyRequest, reply: FastifyReply) {
    return reply.status(200).send({
      success: true,
      message: "Sessão encerrada com sucesso.",
    });
  }
}
