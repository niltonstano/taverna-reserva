import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Types } from "mongoose";
import { ProductService } from "../../src/services/product.service.js";

describe("ProductService - Unidade Completa", () => {
  let productService: ProductService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findPaginated: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    productService = new ProductService(mockRepository);
    jest.clearAllMocks();
  });

  describe("Delete", () => {
    test("Deve deletar produto com estoque zero", async () => {
      const id = new Types.ObjectId().toString();
      mockRepository.findById.mockResolvedValue({
        _id: id,
        stock: 0,
        name: "Vinho",
      });
      mockRepository.delete.mockResolvedValue(true);

      const result = await productService.delete(id);
      expect(result).toBe(true);
    });

    test("Deve impedir deleção com estoque ativo", async () => {
      const id = "qualquer-id";
      mockRepository.findById.mockResolvedValue({
        name: "Vinho Reserva",
        stock: 5,
      });

      await expect(productService.delete(id)).rejects.toThrow(/estoque/);
    });
  });

  describe("Read", () => {
    test("Deve listar com paginação", async () => {
      // ✅ CORREÇÃO: O Service faz destructuring de 'data', não 'products'
      // Se o mock retornar 'products', a variável 'data' no service fica undefined
      mockRepository.findPaginated.mockResolvedValue({
        data: [],
        total: 0,
        pages: 1,
      });

      const result = await productService.list(1, 10);

      expect(result).toHaveProperty("products");
      expect(result.total).toBe(0);
      expect(Array.isArray(result.products)).toBe(true);
    });
  });
});
