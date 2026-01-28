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
      seed: jest.fn(),
    };

    productService = new ProductService(mockRepository);
    jest.clearAllMocks();
  });

  describe("Create", () => {
    test("Deve criar um produto com sucesso", async () => {
      const productData = { name: "mouse", price: 100, stock: 10 };
      mockRepository.create.mockResolvedValue(productData);

      const result = await productService.create(productData as any);
      expect(result.name).toBe("mouse");
    });

    test("Deve propagar erro do repositório", async () => {
      const error = new Error("Duplicate");
      mockRepository.create.mockRejectedValue(error);

      await expect(
        productService.create({ name: "rep" } as any),
      ).rejects.toThrow("Duplicate");
    });
  });

  describe("Update", () => {
    test("Deve atualizar um produto", async () => {
      const id = new Types.ObjectId().toString();

      mockRepository.findById.mockResolvedValue({ _id: id });
      mockRepository.update.mockResolvedValue({ _id: id, price: 40 });

      const result = await productService.update(id, { price: 40 } as any);
      expect(result.price).toBe(40);
    });

    test("Deve lançar erro se não existir", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(productService.update("id", {} as any)).rejects.toThrow(
        /não encontrado/,
      );
    });
  });

  describe("Delete", () => {
    test("Deve deletar produto com estoque zero", async () => {
      const id = new Types.ObjectId().toString();

      mockRepository.findById.mockResolvedValue({ _id: id, stock: 0 });
      mockRepository.delete.mockResolvedValue(true);

      const result = await productService.delete(id);
      expect(result).toBe(true);
    });

    test("Deve impedir deleção com estoque ativo", async () => {
      mockRepository.findById.mockResolvedValue({ stock: 5 });

      await expect(productService.delete("id")).rejects.toThrow(
        "estoque ativo",
      );
    });
  });

  describe("Read", () => {
    test("Deve listar com paginação", async () => {
      mockRepository.findPaginated.mockResolvedValue({ data: [], total: 0 });

      const result = await productService.list(1, 10);

      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
    });

    test("Deve buscar um produto por ID", async () => {
      const product = { name: "Teclado" };
      mockRepository.findById.mockResolvedValue(product);

      const result = await productService.findById("id");
      expect(result.name).toBe("Teclado");
    });
  });
});
