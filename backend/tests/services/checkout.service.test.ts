/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import { OrderController } from "../../src/controllers/order.controller.js";
import { UserRole } from "../../src/middlewares/authorization.js";
import { NotFoundError } from "../../src/utils/errors.js";

describe("OrderController - Unidade via Checkout Service Test", () => {
  let orderController: OrderController;
  let mockOrderService: any;
  let mockCheckoutService: any;
  let mockRequest: any;
  let mockReply: any;

  // IDs válidos para evitar BSONError
  const MOCK_USER_ID = new mongoose.Types.ObjectId().toHexString();

  beforeEach(() => {
    mockOrderService = {
      listUserOrders: jest.fn(),
      listAllOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
      findById: jest.fn(),
    };

    mockCheckoutService = {
      execute: jest.fn(),
    };

    mockRequest = {
      user: {
        id: MOCK_USER_ID,
        email: "nilton@test.com",
        role: UserRole.CUSTOMER,
      },
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

  describe("🛒 checkout", () => {
    it("✅ Deve processar o serviço de checkout com sucesso", async () => {
      mockRequest.body = {
        items: [
          {
            productId: new mongoose.Types.ObjectId().toHexString(),
            quantity: 1,
          },
        ],
        address: "Rua X",
      };
      const mockResult = { order: { id: "ord_1" }, success: true };

      mockCheckoutService.execute.mockResolvedValue(mockResult);

      await orderController.checkout(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Pedido processado com sucesso.",
        }),
      );
    });
  });

  describe("🔄 updateStatus", () => {
    it("❌ Deve lançar erro se o status for inválido", async () => {
      mockRequest.params = { id: new mongoose.Types.ObjectId().toHexString() };
      mockRequest.body = { status: "INVALIDO" };

      // Ajustado para a mensagem real do seu controller
      await expect(
        orderController.updateStatus(mockRequest as any, mockReply as any),
      ).rejects.toThrow(/inválido para a operação/);
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

  describe("🔍 findById", () => {
    it("❌ Deve lançar NotFoundError se o pedido não existir", async () => {
      mockRequest.params = { id: new mongoose.Types.ObjectId().toHexString() };
      mockOrderService.findById.mockResolvedValue(null);

      await expect(
        orderController.findById(mockRequest, mockReply),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
