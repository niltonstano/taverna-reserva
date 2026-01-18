import { FastifyReply, FastifyRequest } from "fastify";
import { CustomerService } from "../services/customer.service.js";

export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  /**
   * Obtém o perfil do cliente pelo ID
   */
  getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    // Usamos o 'as' apenas para o TS saber que o 'id' existe no params
    const { id } = request.params as { id: string };
    
    const customer = await this.customerService.getById(id);
    
    if (!customer) {
      return reply.status(404).send({ 
        success: false, 
        message: "Usuário não encontrado" 
      });
    }

    return reply.send(customer);
  };

  /**
   * Realiza o logout do cliente
   */
  logout = async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ 
      success: true, 
      message: "Sessão encerrada com sucesso" 
    });
  };
}