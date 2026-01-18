import { jest, describe, expect, test, beforeEach } from "@jest/globals";
import { ProductService } from "../../src/services/product.service.js";
import { Types } from "mongoose";

describe("ProductService - Unidade Completa", () => {
  let productService: ProductService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findPaginated: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    productService = new ProductService(mockRepository);
    jest.clearAllMocks();
  });

  describe("Escrita (Create/Update/Delete)", () => {
    test("Deve criar um produto com sucesso", async () => {
      const productData = { name: "mouse", price: 100, stock: 10 };
      const mockCreated = { _id: new Types.ObjectId(), ...productData, toJSON: () => productData };
      mockRepository.create.mockResolvedValue(mockCreated);

      const result = await productService.create(productData as any);
      expect(result.name).toBe("mouse");
    });

    test("Deve lançar erro ao criar produto duplicado (Código 11000)", async () => {
      const error: any = new Error("Duplicate");
      error.code = 11000;
      mockRepository.create.mockRejectedValue(error);

      // ✅ Corrigido para bater com a mensagem real: "O produto 'Rep' já existe."
      await expect(productService.create({ name: "rep" } as any))
        .rejects.toThrow(/já existe/); 
    });

    test("Deve lançar erro genérico se a criação falhar por outro motivo", async () => {
      const error = new Error("Erro de conexão");
      mockRepository.create.mockRejectedValue(error);

      await expect(productService.create({ name: "item" } as any))
        .rejects.toThrow("Erro de conexão");
    });

    test("Deve atualizar um produto e validar deflação", async () => {
      const id = new Types.ObjectId().toString();
      mockRepository.findById.mockResolvedValue({ _id: id, price: 100, toObject: () => ({ price: 100 }) });
      mockRepository.update.mockResolvedValue({ _id: id, price: 40 });

      const result = await productService.update(id, { price: 40 } as any);
      expect(result.price).toBe(40);
    });

    test("Deve lançar erro se o produto a ser atualizado não existir", async () => {
      mockRepository.findById.mockResolvedValue(null);
      // ✅ Corrigido para bater com a mensagem real: "Produto com ID id não encontrado"
      await expect(productService.update("id", {} as any))
        .rejects.toThrow(/não encontrado/);
    });

    test("Deve deletar produto com estoque zero", async () => {
      const id = new Types.ObjectId().toString();
      mockRepository.findById.mockResolvedValue({ _id: id, stock: 0, toObject: () => ({ stock: 0 }) });
      mockRepository.delete.mockResolvedValue(true);

      const result = await productService.delete(id);
      expect(result).toBe(true);
    });

    test("Deve impedir deleção de produto com estoque ativo", async () => {
      mockRepository.findById.mockResolvedValue({ stock: 5, toObject: () => ({ stock: 5 }) });
      await expect(productService.delete("id"))
        .rejects.toThrow("estoque ativo");
    });
  });

  describe("Leitura", () => {
    test("Deve listar com paginação", async () => {
      mockRepository.findPaginated.mockResolvedValue({ data: [], total: 0 });
      const result = await productService.list(1, 10);
      expect(result).toHaveProperty("meta");
    });

    test("Deve buscar um produto por ID", async () => {
      const product = { name: "Teclado", toObject: () => ({ name: "Teclado" }) };
      mockRepository.findById.mockResolvedValue(product);
      const result = await productService.getOne("id");
      expect(result?.name).toBe("Teclado");
    });
  });
});