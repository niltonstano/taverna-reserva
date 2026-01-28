import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Types } from "mongoose";
import { OrderService } from "../../src/services/order.service.js";

describe("OrderService - Unidade", () => {
  let orderService: OrderService;

  const mockOrderRepo = {
    findAll: jest.fn<any>(),
    findByUserId: jest.fn<any>(),
    findById: jest.fn<any>(),
    updateStatus: jest.fn<any>(),
  };

  const mockProductRepo = {
    updateStock: jest.fn<any>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrderRepo.findById.mockResolvedValue({
      _id: "order_123",
      status: "pending",
      items: [],
    });

    orderService = new OrderService(
      mockOrderRepo as any,
      mockProductRepo as any,
    );
  });

  test("Deve atualizar status com sucesso", async () => {
    const id = new Types.ObjectId().toString();

    mockOrderRepo.findById.mockResolvedValue({
      _id: id,
      status: "pending",
      items: [],
    });

    mockOrderRepo.updateStatus.mockResolvedValue({ _id: id, status: "paid" });

    const result = await orderService.updateOrderStatus(id, "paid");

    expect(result!.status).toBe("paid");
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(id, "paid");
  });

  test("listAllOrders deve retornar pedidos", async () => {
    mockOrderRepo.findAll.mockResolvedValue([]);
    await orderService.listAllOrders();
    expect(mockOrderRepo.findAll).toHaveBeenCalled();
  });

  test("listUserOrders deve retornar pedidos do usuário", async () => {
    const userId = new Types.ObjectId().toString();
    mockOrderRepo.findByUserId.mockResolvedValue([]);

    await orderService.listUserOrders(userId);
    expect(mockOrderRepo.findByUserId).toHaveBeenCalledWith(userId);
  });
});
