import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ProductController } from '../../src/controllers/product.controller.js';

describe("ProductController - Cobertura Total", () => {
  let controller: ProductController;
  let mockService: any;
  let mockReq: any;
  let mockReply: any;

  const createFakeProduct = (overrides = {}) => ({
    _id: "507f1f77bcf86cd799439011",
    name: "Cadeira Gamer",
    description: "Conforto total",
    price: 800,
    stock: 10,
    category: "Móveis",
    active: true,
    imageUrl: "http://link.com/img.jpg",
    ...overrides
  });

  beforeEach(() => {
    mockService = {
      list: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    controller = new ProductController(mockService as any);
    mockReq = { params: {}, body: {}, query: {} };
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe("Caminhos de Sucesso", () => {
    it("deve listar produtos (findAll)", async () => {
      mockService.list.mockResolvedValue([createFakeProduct()]);
      await controller.findAll(mockReq, mockReply);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("deve criar um produto com sucesso", async () => {
      const fakeProduct = createFakeProduct();
      mockReq.body = fakeProduct;
      mockService.create.mockResolvedValue(fakeProduct);
      await controller.create(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(201);
    });

    it("deve atualizar um produto com sucesso", async () => {
      mockReq.params = { id: "507f1f77bcf86cd799439011" };
      mockReq.body = { price: 900 };
      mockService.update.mockResolvedValue(createFakeProduct({ price: 900 }));
      await controller.update(mockReq, mockReply);
      expect(mockReply.send).toHaveBeenCalled();
    });

    it("deve deletar um produto com sucesso", async () => {
      mockReq.params = { id: "507f1f77bcf86cd799439011" };
      mockService.delete.mockResolvedValue(true);
      await controller.delete(mockReq, mockReply);
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe("Caminhos de Erro", () => {
    it("deve retornar 404 se não encontrar no findOne", async () => {
      mockReq.params = { id: "id-inexistente" };
      mockService.getOne.mockResolvedValue(null);
      await controller.findOne(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(404);
    });

    it("deve tratar erro no findAll", async () => {
      mockService.list.mockRejectedValue(new Error("Erro interno"));
      await controller.findAll(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(500);
    });

    it("deve tratar erro no update", async () => {
      mockService.update.mockRejectedValue(new Error("Erro update"));
      await controller.update(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(400);
    });

    it("deve tratar erro no findOne", async () => {
      mockService.getOne.mockRejectedValue(new Error("Erro banco"));
      await controller.findOne(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(404);
    });

    it("deve tratar erro no create", async () => {
      mockService.create.mockRejectedValue(new Error("Erro validação"));
      await controller.create(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(400);
    });

    it("deve tratar erro no delete", async () => {
      mockService.delete.mockRejectedValue(new Error("Erro delete"));
      await controller.delete(mockReq, mockReply);
      expect(mockReply.status).toHaveBeenCalledWith(400);
    });
  });
});