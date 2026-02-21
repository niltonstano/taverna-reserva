import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { ProductController } from "../../src/controllers/product.controller.js";

describe("ProductController - Unidade", () => {
  let controller: ProductController;
  let mockProductService: any;
  let mockReq: any;
  let mockReply: any;

  const fakeProduct = {
    _id: "507f1f77bcf86cd799439011",
    name: "Vinho Tinto Reserva",
    price: 150,
    stock: 20,
    category: "Vinhos",
    active: true,
    image_url: "http://link.com/vinho.jpg",
  };

  beforeEach(() => {
    mockProductService = {
      list: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    controller = new ProductController(mockProductService);

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockReq = {
      query: { page: "1", limit: "12", searchTerm: "" },
      params: { id: "507f1f77bcf86cd799439011" },
      body: {},
      log: { error: jest.fn() },
    };
  });

  test("findAll - deve retornar produtos e paginação", async () => {
    mockProductService.list.mockResolvedValue({
      products: [fakeProduct],
      total: 1,
      pages: 1,
    });

    await controller.findAll(mockReq, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        pagination: expect.objectContaining({ total: 1 }),
      }),
    );
  });

  test("findOne - deve retornar o produto normalizado", async () => {
    mockProductService.findById.mockResolvedValue(fakeProduct);

    await controller.findOne(mockReq, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        name: "Vinho Tinto Reserva",
        imageUrl: "http://link.com/vinho.jpg", // Validando a normalização do helper
      }),
    });
  });

  test("create - deve chamar o service e retornar 201", async () => {
    mockReq.body = { name: "Novo Vinho", price: 100, imageUrl: "img.png" };
    mockProductService.create.mockResolvedValue({
      ...fakeProduct,
      name: "Novo Vinho",
    });

    await controller.create(mockReq, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(201);
    expect(mockProductService.create).toHaveBeenCalled();
  });

  test("delete - deve retornar confirmação de remoção", async () => {
    mockProductService.delete.mockResolvedValue(true);

    await controller.delete(mockReq, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      message: "Produto removido com sucesso.",
    });
  });
});
