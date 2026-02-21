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

    // Injeção de dependência no Controller
    orderController = new OrderController(
      mockOrderService,
      mockCheckoutService,
    );
  });

  describe("🛒 checkout", () => {
    it("❌ Deve lançar BadRequestError se idempotency-key faltar", async () => {
      mockRequest.headers = {}; // Remove a chave necessária

      await expect(
        orderController.checkout(mockRequest, mockReply),
      ).rejects.toThrow(BadRequestError);
    });

    it("✅ Deve processar checkout com sucesso", async () => {
      mockRequest.body = {
        items: [
          {
            productId: new mongoose.Types.ObjectId().toHexString(),
            quantity: 1,
          },
        ],
        address: "Rua da Taverna, 1",
      };

      const mockResult = {
        success: true,
        message: "Pedido processado com sucesso.",
        order: { _id: "order1", total: 100 },
        payment_data: { qr_code: "pix-123", ticket_url: "url-boleto" },
      };

      // O controller chama o checkoutService.execute
      mockCheckoutService.execute.mockResolvedValue(mockResult);

      await orderController.checkout(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: "Pedido processado com sucesso.",
        order: mockResult.order,
        payment_data: mockResult.payment_data,
      });
    });
  });

  describe("🔄 updateStatus", () => {
    it("❌ Deve lançar erro para ID inválido do MongoDB", async () => {
      mockRequest.params = { id: "id-invalido" };

      await expect(
        orderController.updateStatus(mockRequest, mockReply),
      ).rejects.toThrow("ID do pedido inválido.");
    });

    it("❌ Deve lançar erro se o status for inválido", async () => {
      mockRequest.params = { id: new mongoose.Types.ObjectId().toHexString() };
      mockRequest.body = { status: "LIXO_STATUS" };

      // O Controller valida contra VALID_ORDER_STATUSES antes de chamar o service
      await expect(
        orderController.updateStatus(mockRequest, mockReply),
      ).rejects.toThrow(/não é permitido/);
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

  describe("🔍 findById (Segurança Anti-IDOR)", () => {
    it("❌ Deve retornar 404 se o pedido for de outro usuário", async () => {
      const orderId = new mongoose.Types.ObjectId().toHexString();
      mockRequest.params = { id: orderId };
      mockRequest.user = { id: "hacker_id", role: UserRole.CUSTOMER };

      // O service retorna um pedido que pertence a "dono_real_id"
      mockOrderService.findById.mockResolvedValue({
        userId: "dono_real_id",
        _id: orderId,
      });

      await expect(
        orderController.findById(mockRequest, mockReply),
      ).rejects.toThrow(NotFoundError);
    });

    it("✅ Deve permitir ADMIN visualizar qualquer pedido", async () => {
      const orderId = new mongoose.Types.ObjectId().toHexString();
      mockRequest.params = { id: orderId };
      mockRequest.user = { id: "admin_id", role: UserRole.ADMIN };

      const orderData = { _id: orderId, userId: "outro_usuario" };
      mockOrderService.findById.mockResolvedValue(orderData);

      await orderController.findById(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: orderData }),
      );
    });
  });
});
