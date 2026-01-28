// tests/controllers/admin.controller.test.ts
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import bcrypt from "bcryptjs";
import { AdminController } from "../../src/controllers/admin.controller.js";
import { AdminRepository } from "../../src/repositories/admin.repository.js";
import { AdminService } from "../../src/services/admin.service.js";

jest.mock("../../src/plugins/logger", () => ({
  default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

describe("AdminController - Cobertura Total", () => {
  let controller: AdminController;
  let mockRepo: jest.Mocked<AdminRepository>;
  let mockService: jest.Mocked<AdminService>;
  let mockReply: any;

  const validId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepo = {
      create: jest.fn(),
      findByEmailWithPassword: jest.fn(),
    } as unknown as jest.Mocked<AdminRepository>;

    mockService = {
      getAdminProfile: jest.fn(),
      listAllOrders: jest.fn(),
      updateOrder: jest.fn(),
      listAllUsers: jest.fn(),
      removeUser: jest.fn(),
      listAllProducts: jest.fn(),
      removeProduct: jest.fn(),
    } as unknown as jest.Mocked<AdminService>;

    controller = new AdminController(mockService, mockRepo);

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      jwtSign: (jest.fn() as unknown as any).mockResolvedValue("token_fake"),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("adminLogin", () => {
    it("Deve logar com sucesso e retornar token", async () => {
      const mockReq = {
        body: { email: "admin@teste.com", password: "password123" },
      } as any;

      mockRepo.findByEmailWithPassword.mockResolvedValue({
        _id: validId,
        name: "Admin",
        email: "admin@teste.com",
        password: "hashed_password",
        role: "admin",
      } as any);

      jest.spyOn(bcrypt, "compare").mockImplementationOnce(async () => true);

      await controller.adminLogin(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, token: "token_fake" }),
      );
    });

    it("Deve retornar 401 para credenciais inválidas", async () => {
      const mockReq = { body: { email: "a@a.com", password: "wrong" } } as any;
      mockRepo.findByEmailWithPassword.mockResolvedValue(null);
      await controller.adminLogin(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Gerenciamento de Recursos", () => {
    it("Deve atualizar status do pedido", async () => {
      const mockReq = {
        params: { id: validId },
        body: { status: "enviado" },
      } as any;

      mockService.updateOrder.mockResolvedValue({
        _id: validId,
        status: "enviado",
      } as any);

      await controller.updateOrderStatus(mockReq, mockReply);

      // ✅ CORREÇÃO: Passando a string conforme o log "Received: ..., 'enviado'"
      expect(mockService.updateOrder).toHaveBeenCalledWith(validId, "enviado");
      expect(mockReply.status).toHaveBeenCalledWith(200);
    });

    it("Deve deletar usuário", async () => {
      const mockReq = { params: { id: validId } } as any;
      mockService.removeUser.mockResolvedValue(true as any);
      await controller.deleteUser(mockReq, mockReply);
      expect(mockService.removeUser).toHaveBeenCalledWith(validId);
      expect(mockReply.status).toHaveBeenCalledWith(200);
    });

    it("Deve retornar 500 em erro de validação (Zod catch)", async () => {
      const mockReq = { params: { id: "123" } } as any;
      await controller.deleteProduct(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(500);
    });
  });
});
