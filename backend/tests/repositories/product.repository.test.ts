import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "@jest/globals";
import { ProductModel } from "../../src/models/product.model.js";
import { ProductRepository } from "../../src/repositories/product.repository.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("ProductRepository - Unidade e Atomicidade", () => {
  let repository: ProductRepository;

  beforeAll(async () => {
    // Usamos o setup que cria o ReplicaSet para suportar sessions
    await setupMongoMemory();
    repository = new ProductRepository();
  });

  afterAll(async () => {
    await teardownMongoMemory();
  });

  afterEach(async () => {
    await ProductModel.deleteMany({});
  });

  describe("📦 create", () => {
    it("deve criar um produto com todos os campos obrigatórios", async () => {
      const productData = {
        name: "Vinho Tinto Reserva",
        description: "Um vinho encorpado",
        price: 150,
        stock: 10,
        category: "Vinho", // Usando categoria válida conforme seu Schema
        active: true,
      };

      const product = await repository.create(productData);

      expect(product._id).toBeDefined();
      expect(product.name).toBe("Vinho Tinto Reserva");
      expect(product.stock).toBe(10);
    });
  });

  describe("🛡️ updateStock (O Coração da Taverna)", () => {
    it("deve reduzir o estoque com sucesso quando houver saldo", async () => {
      const product = await ProductModel.create({
        name: "Vinho de Teste",
        price: 10,
        stock: 5,
        category: "Vinho",
        active: true,
      });

      const updated = await repository.updateStock(product._id.toString(), 3);

      expect(updated).toBeDefined();
      expect(updated?.stock).toBe(2); // 5 - 3 = 2
    });

    it("deve retornar null e NÃO reduzir o estoque se o saldo for insuficiente", async () => {
      const product = await ProductModel.create({
        name: "Vinho Raro",
        price: 10,
        stock: 2,
        category: "Vinho",
        active: true,
      });

      // Tenta tirar 5 de onde só tem 2
      const updated = await repository.updateStock(product._id.toString(), 5);

      expect(updated).toBeNull();

      const checkInDb = await ProductModel.findById(product._id);
      expect(checkInDb?.stock).toBe(2); // Estoque intacto
    });

    it("deve aceitar valores negativos para repor estoque (Rollback)", async () => {
      const product = await ProductModel.create({
        name: "Vinho Rollback",
        price: 10,
        stock: 5,
        category: "Vinho",
        active: true,
      });

      // Passando -5 para repor: 5 - (-5) = 10
      const updated = await repository.updateStock(product._id.toString(), -5);

      expect(updated?.stock).toBe(10);
    });

    it("deve retornar null se o produto estiver inativo", async () => {
      const product = await ProductModel.create({
        name: "Vinho Antigo",
        price: 10,
        stock: 10,
        category: "Vinho",
        active: false, // Produto inativo
      });

      const updated = await repository.updateStock(product._id.toString(), 1);
      expect(updated).toBeNull();
    });
  });

  describe("🔍 findPaginated & Soft Delete", () => {
    it("deve retornar apenas produtos ativos na paginação", async () => {
      await ProductModel.create([
        {
          name: "Vinho 1",
          price: 10,
          stock: 5,
          category: "Vinho",
          active: true,
        },
        {
          name: "Vinho 2",
          price: 10,
          stock: 5,
          category: "Vinho",
          active: false,
        },
      ]);

      const result = await repository.findPaginated(1, 10);
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
    });

    it("deve realizar o soft delete corretamente", async () => {
      const product = await ProductModel.create({
        name: "Vinho para Deletar",
        price: 10,
        stock: 5,
        category: "Vinho",
        active: true,
      });

      const success = await repository.delete(product._id.toString());
      expect(success).toBe(true);

      const dbProduct = await ProductModel.findById(product._id);
      expect(dbProduct?.active).toBe(false);
    });
  });
});
