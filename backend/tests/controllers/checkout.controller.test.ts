import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { CheckoutController } from "../../src/controllers/checkout.controller.js";
import { Types } from "mongoose";

describe("CheckoutController - Unidade", () => {
  let controller: CheckoutController;
  let mockCheckoutService: any;
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    // 1. Mock do Serviço
    mockCheckoutService = {
      execute: jest.fn(),
    };

    controller = new CheckoutController(mockCheckoutService);

    // 2. Mock do Reply (Fastify)
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // 3. Mock do Request (Fastify) com Logger
    mockRequest = {
      user: { id: new Types.ObjectId().toString(), role: "customer" },
      headers: { "idempotency-key": "uuid-random-123" },
      log: { error: jest.fn() } // Importante para não quebrar o catch
    };
  });

  it("Deve retornar 401 se o ID do usuário for inválido ou ausente", async () => {
    mockRequest.user = { id: "id-invalido" };

    await controller.handleCheckout(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining("inválido")
    }));
  });

  it("Deve retornar 400 se a Idempotency-Key estiver faltando ou não for string", async () => {
    mockRequest.headers = {}; // Remove o header

    await controller.handleCheckout(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining("obrigatória")
    }));
  });

  it("Deve retornar 201 e criar o pedido com sucesso", async () => {
    const mockOrder = { _id: "order123", total: 150 };
    mockCheckoutService.execute.mockResolvedValue(mockOrder);

    await controller.handleCheckout(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(201);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      order: mockOrder
    });
  });

  it("Deve retornar 409 se houver erro de negócio (ex: Estoque)", async () => {
    const errorMsg = "Estoque insuficiente para o produto X";
    mockCheckoutService.execute.mockRejectedValue(new Error(errorMsg));

    await controller.handleCheckout(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(409);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      message: errorMsg
    });
  });

  it("Deve retornar 500 para erros genéricos e logar o erro", async () => {
    mockCheckoutService.execute.mockRejectedValue(new Error("Erro de banco de dados"));

    await controller.handleCheckout(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockRequest.log.error).toHaveBeenCalled(); // Verifica se o log foi disparado
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false
    }));
  });
});