import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { CheckoutController } from "../../src/controllers/checkout.controller.js";

describe("🧪 CheckoutController - Deep Validation & Stress", () => {
  let controller: CheckoutController;
  let mockCheckoutService: any;
  let mockReply: any;

  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    mockCheckoutService = { execute: jest.fn() };
    mockCheckoutService.execute.mockResolvedValue({
      order: { id: "123" },
      payment_data: { qr_code: "pix" },
    });

    controller = new CheckoutController(mockCheckoutService);

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;
  });

  describe("🚀 Casos de Borda e Consistência", () => {
    it("🔒 Deve passar os dados corretamente para o Service quando tudo é válido", async () => {
      const userId = "user_real_123";
      const userEmail = "nilton@teste.com";

      // 🎯 PAYLOAD AJUSTADO: Apenas o que está no seu CheckoutBodySchema
      const body = {
        address: "Rua dos Testes, 123",
        zipCode: "12345678",
        total: 100,
        shipping: {
          service: "Sedex",
          price: 25,
          deadline: 3,
          company: "Correios",
        },
        items: [
          {
            productId: "507f1f77bcf86cd799439011",
            quantity: 1,
          },
        ],
      };

      const req = {
        user: { id: userId, email: userEmail },
        body,
        headers: { "idempotency-key": VALID_UUID },
      } as any;

      await controller.handle(req, mockReply);

      // Se ainda der 400, o console log abaixo dirá o motivo exato
      if (mockReply.status.mock.calls[0]?.[0] === 400) {
        console.log(
          "❌ DETALHE DO ERRO:",
          JSON.stringify(mockReply.send.mock.calls[0][0].details, null, 2),
        );
      }

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockCheckoutService.execute).toHaveBeenCalled();
    });
  });
});
