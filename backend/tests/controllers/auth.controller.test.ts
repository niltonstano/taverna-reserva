import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { AuthController } from "../../src/controllers/auth.controller.js";
import { ConflictError, UnauthorizedError } from "../../src/utils/errors.js";

describe("AuthController - Unidade (Cobertura Total)", () => {
  let controller: AuthController;
  let mockReq: any;
  let mockReply: any;
  let mockService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      registerAdmin: jest.fn(),
      registerCustomer: jest.fn(),
      login: jest.fn(),
    };

    controller = new AuthController(mockService as any);

    mockReq = {
      body: {},
      log: { error: jest.fn() },
    };

    mockReply = {
      status: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      jwtSign: jest
        .fn<any>()
        .mockImplementation(() => Promise.resolve("token_fake_123")),
    };
  });

  describe("🏗️ Instanciação", () => {
    it("✅ deve instanciar com o serviço padrão", () => {
      const defaultController = new AuthController();
      expect(defaultController).toBeInstanceOf(AuthController);
    });
  });

  describe("🔑 Fluxo de Login", () => {
    it("✅ deve realizar login de cliente e assinar JWT", async () => {
      mockReq.body = { email: "customer@test.com", password: "123" };

      mockService.login.mockImplementation(
        async (e: any, p: any, t: any, sign: any) => {
          const token = await sign({ id: "user123", role: "customer" });
          return { token, user: { id: "user123", name: "Teste" } };
        },
      );

      await controller.customerLogin(mockReq, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.jwtSign).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({ token: "token_fake_123" }),
      );
    });

    it("✅ deve realizar login administrativo com headers de segurança", async () => {
      mockReq.body = { email: "admin@test.com", password: "123" };
      mockService.login.mockResolvedValue({
        token: "admin_tk",
        user: { id: "admin1", name: "Admin" },
      });

      await controller.adminLogin(mockReq, mockReply);

      expect(mockReply.header).toHaveBeenCalledWith(
        "Cache-Control",
        "no-store",
      );
      expect(mockReply.status).toHaveBeenCalledWith(200);
    });

    it("❌ deve repassar erro de credenciais", async () => {
      mockService.login.mockRejectedValue(new UnauthorizedError("Invalido"));
      await expect(
        controller.customerLogin(mockReq, mockReply),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("📝 Fluxo de Registro", () => {
    it("✅ deve registrar cliente e retornar 201", async () => {
      mockService.registerCustomer.mockResolvedValue({
        id: "new_c",
        name: "Novo",
      });
      await controller.customerRegister(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(201);
    });

    it("❌ deve repassar ConflictError se e-mail já existir", async () => {
      mockService.registerCustomer.mockRejectedValue(
        new ConflictError("Conflito"),
      );
      await expect(
        controller.customerRegister(mockReq, mockReply),
      ).rejects.toThrow(ConflictError);
    });
  });
});
