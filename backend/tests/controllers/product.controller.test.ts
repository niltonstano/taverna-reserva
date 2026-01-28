import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ProductController } from "../../src/controllers/product.controller.js";

describe("ProductController - Cobertura Real", () => {
  let controller: ProductController;
  let mockService: any;
  let mockReq: any;
  let mockReply: any;

  const fakeProduct = {
    _id: "507f1f77bcf86cd799439011",
    name: "Cadeira Gamer",
    description: "Conforto total",
    price: 800,
    stock: 10,
    category: "Móveis",
    active: true,
    imageUrl: "http://link.com/img.jpg",
  };

  beforeEach(() => {
    mockService = {
      list: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    controller = new ProductController(mockService);
    mockReq = {
      params: {},
      body: {},
      query: { page: 1, limit: 10 },
      log: { error: jest.fn() },
    };
    mockReply = { status: jest.fn().mockReturnThis(), send: jest.fn() };
  });

  it("findAll deve retornar paginação", async () => {
    mockService.list.mockResolvedValue({
      products: [fakeProduct],
      total: 1,
    });

    await controller.findAll(mockReq, mockReply);

    expect(mockReply.send).toHaveBeenCalledWith({
      data: [fakeProduct],
      total: 1,
      page: 1,
      totalPages: 1,
    });
  });

  it("findOne deve falhar com ID inválido", async () => {
    mockReq.params.id = "123";
    await controller.findOne(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(400);
  });

  it("create deve retornar 201", async () => {
    mockReq.body = fakeProduct;
    mockService.create.mockResolvedValue(fakeProduct);

    await controller.create(mockReq, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(201);
    expect(mockReply.send).toHaveBeenCalledWith(fakeProduct);
  });

  it("update deve retornar produto atualizado", async () => {
    mockReq.params.id = fakeProduct._id;
    mockReq.body = { price: 900 };
    mockService.update.mockResolvedValue({ ...fakeProduct, price: 900 });

    await controller.update(mockReq, mockReply);
    expect(mockReply.send).toHaveBeenCalled();
  });

  it("delete deve retornar mensagem correta", async () => {
    mockReq.params.id = fakeProduct._id;
    mockService.delete.mockResolvedValue(true);

    await controller.delete(mockReq, mockReply);

    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      message: "Rótulo removido com sucesso.",
    });
  });
});
