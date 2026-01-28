import { jest } from "@jest/globals";
import { CustomerController } from "../../src/controllers/customer.controller.js";
import { CustomerService } from "../../src/services/customer.service.js";

describe("CustomerController", () => {
  let controller: CustomerController;
  let mockCustomerService: jest.Mocked<CustomerService>;
  let mockReply: any;

  beforeEach(() => {
    mockCustomerService = {
      getById: jest.fn(),
    } as any;

    controller = new CustomerController(mockCustomerService);

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe("getProfile", () => {
    it("deve retornar o perfil do cliente com sucesso", async () => {
      const mockCustomer = {
        id: "123",
        name: "Nilton",
        email: "nilton@test.com",
      };

      const mockRequest = { params: { id: "123" } } as any;

      mockCustomerService.getById.mockResolvedValue(mockCustomer as any);

      await controller.getProfile(mockRequest, mockReply);

      expect(mockCustomerService.getById).toHaveBeenCalledWith("123");

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockCustomer,
      });
    });

    it("deve retornar 404 se o cliente não for encontrado", async () => {
      const mockRequest = { params: { id: "nao-existe" } } as any;

      mockCustomerService.getById.mockResolvedValue(null);

      await controller.getProfile(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: "Usuário não localizado em nossa base",
      });
    });
  });

  describe("logout", () => {
    it("deve retornar mensagem de sucesso no logout", async () => {
      const mockRequest = {
        user: { id: "123" },
        log: { info: jest.fn() },
      } as any;

      await controller.logout(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: "Sessão encerrada com sucesso",
      });
    });
  });
});
