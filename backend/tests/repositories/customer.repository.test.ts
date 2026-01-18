import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { CustomerRepository } from "../../src/repositories/customer.repository.js";
import { CustomerModel } from "../../src/models/customer.model.js";
import { Types } from "mongoose";
import { setupMongoMemory, teardownMongoMemory } from "../helpers/mongo-memory.js"; // Ajuste o caminho se necessário

describe("CustomerRepository - Integração", () => {
  let repository: CustomerRepository;

  // Inicia o MongoDB em memória antes de todos os testes
  beforeAll(async () => {
    await setupMongoMemory();
  });

  // Encerra o MongoDB em memória após todos os testes
  afterAll(async () => {
    await teardownMongoMemory();
  });

  beforeEach(() => {
    repository = new CustomerRepository();
  });

  // Limpa a coleção de clientes após cada teste para evitar poluição de dados
  afterEach(async () => {
    await CustomerModel.deleteMany({});
  });

  describe("findById", () => {
    it("deve encontrar um cliente pelo ID", async () => {
      const created = await CustomerModel.create({
        name: "Busca ID",
        email: "id@test.com",
        password: "123",
        role: "customer"
      });

      const result = await repository.findById(created._id.toString());
      
      expect(result).not.toBeNull();
      expect(result?.email).toBe("id@test.com");
    });

    it("deve retornar null para um ID inexistente", async () => {
      const fakeId = new Types.ObjectId().toString();
      const result = await repository.findById(fakeId);
      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("deve encontrar cliente por email", async () => {
      const email = "find@me.com";
      await CustomerModel.create({
        name: "Find Me",
        email,
        password: "password",
        role: "customer"
      });

      const result = await repository.findByEmail(email);
      expect(result).not.toBeNull();
      expect(result?.email).toBe(email);
    });
  });

  describe("create", () => {
    it("deve persistir um novo cliente no banco", async () => {
      const data = {
        name: "Repo Test",
        email: "repo@test.com",
        password: "hashed_password",
        role: "customer" as const
      };

      const result = await repository.create(data);
      
      expect(result._id).toBeDefined();
      expect(result.name).toBe("Repo Test");
      
      // Verificação dupla: conferindo direto no Model
      const saved = await CustomerModel.findById(result._id);
      expect(saved).not.toBeNull();
      expect(saved?.email).toBe(data.email);
    });
  });

  describe("update", () => {
    it("deve atualizar dados do cliente", async () => {
      const created = await CustomerModel.create({
        name: "Old Name",
        email: "old@test.com",
        password: "123",
        role: "customer"
      });

      const result = await repository.update(created._id.toString(), { name: "New Name" });
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe("New Name");
      
      // Verifica se no banco mudou mesmo
      const updatedInDb = await CustomerModel.findById(created._id);
      expect(updatedInDb?.name).toBe("New Name");
    });
  });

  describe("delete", () => {
    it("deve remover cliente do banco", async () => {
      const created = await CustomerModel.create({
        name: "To Delete",
        email: "del@test.com",
        password: "123",
        role: "customer"
      });

      const result = await repository.delete(created._id.toString());
      expect(result).not.toBeNull();

      const found = await CustomerModel.findById(created._id);
      expect(found).toBeNull();
    });
  });
});