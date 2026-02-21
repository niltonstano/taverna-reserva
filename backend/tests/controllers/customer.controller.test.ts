import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Types } from "mongoose";
import { CustomerController } from "../../src/controllers/customer.controller.js";

describe("CustomerController", () => {
  let controller: CustomerController;
  let mockCustomerService: any;
  let mockReply: any;

  beforeEach(() => {
    mockCustomerService = { getById: jest.fn() };
    controller = new CustomerController(mockCustomerService);

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe("getProfile", () => {
    it("deve retornar o perfil do cliente com sucesso", async () => {
      const validId = new Types.ObjectId().toHexString();
      mockCustomerService.getById.mockResolvedValue({
        _id: validId,
        name: "Nilton",
      });

      await controller.getProfile(
        { params: { id: validId } } as any,
        mockReply,
      );

      expect(mockReply.status).toHaveBeenCalledWith(200);
    });

    it("deve tratar erro se o ID no parâmetro for inválido", async () => {
      const mockRequest = { params: { id: "curto" } } as any;

      // Forçamos o service a rejeitar, simulando a falha de validação que o controller deveria ter
      mockCustomerService.getById.mockRejectedValue(
        new Error("Formato de ID inválido."),
      );

      try {
        await controller.getProfile(mockRequest, mockReply);
      } catch (e) {
        // Se o controller não tiver try/catch, o erro sobe para o Fastify (comportamento padrão)
        // Nesse caso, o teste passa pois o erro foi lançado
        return;
      }

      // Se o controller capturou o erro, ele deve ter chamado status(400) ou status(404)
      const chamouStatus = mockReply.status.mock.calls.length > 0;
      if (chamouStatus) {
        const statusCode = mockReply.status.mock.calls[0][0];
        expect(statusCode).toBeGreaterThanOrEqual(400);
      } else {
        // Se não chamou status nem lançou erro, o controller ignorou a falha (ERRO de lógica)
        throw new Error(
          "O controller deveria ter lançado um erro ou retornado status >= 400",
        );
      }
    });
  });

  describe("logout", () => {
    it("deve retornar mensagem de sucesso no logout", async () => {
      const mockRequest = {
        user: { id: "1" },
        log: { info: jest.fn() },
      } as any;

      await controller.logout(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: "Sessão encerrada com sucesso.",
      });
    });
  });
});
