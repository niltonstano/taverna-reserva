import { FastifyReply, FastifyRequest } from "fastify";
import { CustomerService } from "../services/customer.service.js";

/**
 * Controller responsável pela gestão de clientes.
 * Blindado contra vazamento de dados e com logs de erro para produção.
 */
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  /**
   * Lista todos os clientes (Uso Exclusivo Admin)
   * Inclui paginação e logs de sistema.
   */
  getAll = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page, limit } = request.query as {
        page?: number;
        limit?: number;
      };

      const customers = await this.customerService.findAll(
        Number(page) || 1,
        Number(limit) || 50,
      );

      return reply.send({
        success: true,
        data: customers,
        meta: {
          page: Number(page) || 1,
          limit: Number(limit) || 50,
        },
      });
    } catch (error) {
      request.log.error(error); // Essencial para monitorar falhas no Docker/Cloud
      return reply.status(500).send({
        success: false,
        message: "Erro interno ao processar listagem de clientes",
      });
    }
  };

  /**
   * Obtém o perfil individual do cliente
   * O Service já higieniza os dados (remove senhas).
   */
  getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const customer = await this.customerService.getById(id);

      if (!customer) {
        return reply.status(404).send({
          success: false,
          message: "Usuário não localizado em nossa base",
        });
      }

      // Enviamos o retorno direto do service pois ele já é um objeto seguro (sem senha)
      return reply.send({
        success: true,
        data: customer,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        message:
          "Erro ao processar consulta de perfil. Verifique o ID fornecido.",
      });
    }
  };

  /**
   * Realiza o encerramento da sessão
   */
  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    // Logamos o ID do usuário que saiu para auditoria simples
    request.log.info(`User logged out: ${request.user?.id || "unknown"}`);

    return reply.send({
      success: true,
      message: "Sessão encerrada com sucesso",
    });
  };
}
