import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { CheckoutController } from "../../src/controllers/checkout.controller.js";

describe("CheckoutController - Unidade", () => {
  let controller: CheckoutController;
  let mockCheckoutService: any;
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    mockCheckoutService = {
      execute: jest.fn(),
    };

    controller = new CheckoutController(mockCheckoutService);

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    mockRequest = {
      // ✅ ObjectId VÁLIDO
      user: { id: "507f1f77bcf86cd799439011" },
      body: { email: "user@test.com" },
      headers: { "idempotency-key": "550e8400-e29b-41d4-a716-446655440000" },
      log: { error: jest.fn(), warn: jest.fn() },
    };
  });

  it("Deve retornar 201 e criar o pedido com sucesso", async () => {
    mockCheckoutService.execute.mockResolvedValue({ id: "order123" });

    // ✅ NOME DO MÉTODO CERTO
    await controller.handle(mockRequest, mockReply);

    expect(mockCheckoutService.execute).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      "550e8400-e29b-41d4-a716-446655440000",
      "user@test.com",
    );

    expect(mockReply.status).toHaveBeenCalledWith(201);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      data: { id: "order123" },
    });
  });
});
