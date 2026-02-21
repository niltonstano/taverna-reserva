import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { CartController } from "../../src/controllers/cart.controller.js";
import { UnauthorizedError } from "../../src/utils/errors.js";

describe("CartController - Testes Completos", () => {
  let controller: CartController;
  let mockCartService: any;
  let mockReq: any;
  let mockReply: any;

  // Mock de um ObjectId válido para passar na validação do Mongoose
  const validUserId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
    mockCartService = {
      getCartByUserId: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
    };

    controller = new CartController(mockCartService);

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockReq = {
      user: { id: validUserId },
      log: { error: jest.fn() },
      body: {},
      params: {},
    } as any;
  });

  test("getCart - deve retornar o carrinho com sucesso", async () => {
    mockCartService.getCartByUserId.mockResolvedValue({ items: [] });
    await controller.getCart(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(200);
  });

  test("validateUser - deve lançar erro se o ID for inválido", async () => {
    mockReq.user.id = "invalid-id";
    await expect(controller.getCart(mockReq, mockReply)).rejects.toThrow(
      UnauthorizedError,
    );
  });

  test("handleError - deve relançar falhas do service para o handler global", async () => {
    const serviceError = new Error("Erro de conexão");
    mockCartService.getCartByUserId.mockRejectedValue(serviceError);

    // Como o controller agora dá "throw error", o expect deve ser .rejects
    await expect(controller.getCart(mockReq, mockReply)).rejects.toThrow(
      "Erro de conexão",
    );
  });
});
