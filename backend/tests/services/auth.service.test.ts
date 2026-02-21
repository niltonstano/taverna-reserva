import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import { AuthService } from "../../src/services/auth.service.js";
import { UnauthorizedError } from "../../src/utils/errors.js";

describe("AuthService - Unidade (Cobertura Total)", () => {
  let service: AuthService;
  let mockAdminRepo: any;
  let mockCustomerRepo: any;

  const mockSignToken = jest
    .fn<any>()
    .mockImplementation(() => Promise.resolve("token_fake_123"));

  beforeEach(() => {
    jest.clearAllMocks();

    mockAdminRepo = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      create: jest.fn(),
    };

    mockCustomerRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    service = new AuthService(mockCustomerRepo as any, mockAdminRepo as any);
  });

  // Helper para simular o comportamento do Mongoose e o método toPublicUser interno
  const createMockUser = (data: any) => ({
    ...data,
    toObject: () => ({ ...data, _id: data.id || "507f1f77bcf86cd799439011" }),
    // Caso seu service use .name ou outros campos, eles estão aqui:
    name: data.name || "Usuário Teste",
    email: data.email || "teste@teste.com",
    role: data.role || "customer",
  });

  describe("🛡️ Registro", () => {
    it("✅ deve registrar um cliente com sucesso", async () => {
      const userData = { name: "Nilton", email: "n@t.com", password: "123" };
      const savedUser = createMockUser({
        ...userData,
        id: "123",
        role: "customer",
      });

      mockCustomerRepo.create.mockResolvedValue(savedUser);

      const result = await service.registerCustomer(userData as any);

      expect(result.email).toBe(userData.email);
      expect(result.name).toBe("Nilton");
    });
  });

  describe("🔑 Login", () => {
    it("✅ deve logar cliente com sucesso e retornar token", async () => {
      const password = "password123";
      const hash = await bcrypt.hash(password, 1);
      const dbUser = createMockUser({
        id: "c1",
        name: "Cliente Teste",
        email: "c@c.com",
        password: hash,
        role: "customer",
      });

      mockCustomerRepo.findByEmail.mockResolvedValue(dbUser);

      const result = await service.login(
        "c@c.com",
        password,
        "customer",
        mockSignToken,
      );

      expect(result.token).toBe("token_fake_123");
      expect(result.user.name).toBe("Cliente Teste");
      expect(mockSignToken).toHaveBeenCalled();
    });

    it("✅ deve logar admin usando findByEmailWithPassword", async () => {
      const password = "admin_password";
      const hash = await bcrypt.hash(password, 1);
      const dbAdmin = createMockUser({
        id: "a1",
        name: "Admin",
        email: "a@a.com",
        password: hash,
        role: "admin",
      });

      mockAdminRepo.findByEmailWithPassword.mockResolvedValue(dbAdmin);

      const result = await service.login(
        "a@a.com",
        password,
        "admin",
        mockSignToken,
      );

      expect(mockAdminRepo.findByEmailWithPassword).toHaveBeenCalled();
      expect(result.user.role).toBe("admin");
    });

    it("❌ deve lançar UnauthorizedError se a senha estiver incorreta", async () => {
      const hash = await bcrypt.hash("correta", 1);
      const dbUser = createMockUser({ password: hash });

      mockCustomerRepo.findByEmail.mockResolvedValue(dbUser);

      await expect(
        service.login("test@test.com", "errada", "customer", mockSignToken),
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
