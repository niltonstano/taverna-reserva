/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import { OrderController } from "../../src/controllers/order.controller.js";
import { UserRole } from "../../src/middlewares/authorization.js";
import { BadRequestError, NotFoundError } from "../../src/utils/errors.js";

describe("OrderController - Unidade", () => {
  let orderController: OrderController;
  let mockOrderService: any;
  let mockCheckoutService: any;
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    // 1. Mocks dos Services
    mockOrderService = {
      listUserOrders: jest.fn(),
      listAllOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
      findById: jest.fn(),
    };

    mockCheckoutService = {
      execute: jest.fn(),
    };

    // 2. Mocks do Fastify (Request/Reply)
    mockRequest = {
      user: { id: "user1", email: "nilton@test.com", role: UserRole.CUSTOMER },
      headers: { "idempotency-key": "uuid-fake-123" },
      body: {},
      params: {},
      query: {},
    };

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    orderController = new OrderController(
      mockOrderService,
      mockCheckoutService,
    );
  });

  describe("🛒 checkout (createOrder)", () => {
    it("✅ Deve chamar o checkoutService com os parâmetros corretos", async () => {
      const mockServiceResult = {
        success: true,
        message: "Pedido processado com sucesso.", // 📝 Sincronizado com o Controller
        order: { _id: "order1", total: 100 },
        payment_data: { qr_code: "123", ticket_url: "url" },
      };

      mockCheckoutService.execute.mockResolvedValue(mockServiceResult);

      await orderController.checkout(mockRequest as any, mockReply as any);

      // Verificação do retorno exato enviado ao cliente
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: "Pedido processado com sucesso.", // 📝 Sincronizado com o Controller
        order: mockServiceResult.order,
        payment_data: mockServiceResult.payment_data,
      });
    });

    it("❌ Deve lançar BadRequestError se idempotency-key faltar", async () => {
      mockRequest.headers = {};

      await expect(
        orderController.checkout(mockRequest, mockReply),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("🔄 updateStatus", () => {
    it("❌ Deve lançar erro para ID inválido do MongoDB", async () => {
      mockRequest.params = { id: "id-invalido" };

      await expect(
        orderController.updateStatus(mockRequest as any, mockReply as any),
      ).rejects.toThrow("ID do pedido inválido."); // 📝 Sincronizado com a mensagem curta
    });

    it("❌ Deve lançar erro se o status for inválido", async () => {
      mockRequest.params = { id: new mongoose.Types.ObjectId().toHexString() };
      mockRequest.body = { status: "INVALIDO" };

      await expect(
        orderController.updateStatus(mockRequest as any, mockReply as any),
      ).rejects.toThrow(/não é permitido/); // 📝 Regex flexível para a mensagem dinâmica
    });

    it("✅ Deve atualizar status com sucesso", async () => {
      const orderId = new mongoose.Types.ObjectId().toHexString();
      mockRequest.params = { id: orderId };
      mockRequest.body = { status: "paid" };

      const updatedOrder = { _id: orderId, status: "paid" };
      mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);

      await orderController.updateStatus(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedOrder,
        }),
      );
    });
  });

  describe("🔍 findById (Anti-IDOR)", () => {
    it("❌ Deve retornar 404 se o pedido for de outro usuário", async () => {
      mockRequest.params = { id: new mongoose.Types.ObjectId().toHexString() };
      mockRequest.user = { id: "hacker_id", role: UserRole.CUSTOMER };

      mockOrderService.findById.mockResolvedValue({
        userId: "dono_real_id",
        _id: mockRequest.params.id,
      });

      await expect(
        orderController.findById(mockRequest, mockReply),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
