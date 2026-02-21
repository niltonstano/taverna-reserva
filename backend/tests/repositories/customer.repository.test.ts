import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { Types } from "mongoose";
import { CustomerModel } from "../../src/models/customer.model.js";
import { CustomerRepository } from "../../src/repositories/customer.repository.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

// Aumenta o tempo limite global para este arquivo (o MongoDB Memory Server pode ser lento)
jest.setTimeout(20000);

describe("CustomerRepository - Integração", () => {
  let repository: CustomerRepository;

  beforeAll(async () => {
    try {
      await setupMongoMemory();
    } catch (error) {
      console.error("Erro no setupMongoMemory:", error);
      throw error;
    }
  });

  afterAll(async () => {
    await teardownMongoMemory();
  });

  beforeEach(() => {
    repository = new CustomerRepository();
  });

  afterEach(async () => {
    // Limpa apenas se a conexão estiver ativa
    if (CustomerModel.db.readyState === 1) {
      await CustomerModel.deleteMany({});
    }
  });

  describe("findAll", () => {
    it("deve retornar clientes paginados e o total", async () => {
      await CustomerModel.create([
        {
          name: "User 1",
          email: "u1@test.com",
          password: "123",
          role: "customer",
        },
        {
          name: "User 2",
          email: "u2@test.com",
          password: "123",
          role: "customer",
        },
      ]);

      const result = await repository.findAll(1, 10);
      expect(result.customers.length).toBe(2);
      expect(result.total).toBe(2);
    });
  });

  describe("findById", () => {
    it("deve encontrar um cliente pelo ID", async () => {
      const created = await CustomerModel.create({
        name: "Busca ID",
        email: "id@test.com",
        password: "123",
        role: "customer",
      });

      const result = await repository.findById(created._id.toString());
      expect(result?.email).toBe("id@test.com");
    });
  });

  describe("findByEmail", () => {
    it("deve encontrar cliente por email com tratamento de string", async () => {
      await CustomerModel.create({
        name: "Find Me",
        email: "find@me.com",
        password: "password",
        role: "customer",
      });

      // Valida o toLowerCase().trim() do seu repo
      const result = await repository.findByEmail("  FIND@ME.COM  ");
      expect(result?.email).toBe("find@me.com");
    });
  });

  describe("create", () => {
    it("deve persistir um novo cliente e retornar objeto ICustomerData", async () => {
      const data = {
        name: "Repo Test",
        email: "repo@test.com",
        password: "hashed_password",
        role: "customer" as const,
      };

      const result = await repository.create(data);
      expect(result.name).toBe("Repo Test");
      expect(result._id).toBeDefined();
    });
  });

  describe("delete", () => {
    it("deve retornar true ao remover cliente existente", async () => {
      const created = await CustomerModel.create({
        name: "To Delete",
        email: "del@test.com",
        password: "123",
        role: "customer",
      });

      const result = await repository.delete(created._id.toString());
      expect(result).toBe(true); // O seu repo usa !!result, então retorna boolean
    });

    it("deve retornar false para ID inexistente", async () => {
      const result = await repository.delete(new Types.ObjectId().toString());
      expect(result).toBe(false);
    });
  });
});
