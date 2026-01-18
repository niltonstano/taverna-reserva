import { jest, describe, expect, test, beforeEach } from "@jest/globals";
import { OrderService } from "../../src/services/order.service.js";
import { Types } from "mongoose";

describe("OrderService - Unidade", () => {
  let orderService: OrderService;

  // 1. Mudamos de 'update' para 'updateStatus' para casar com o Service
  const mockOrderRepo = { 
    findAll: jest.fn<any>(),
    findByUserId: jest.fn<any>(),
    findById: jest.fn<any>(),
    updateStatus: jest.fn<any>() // ✅ Alterado aqui
  };
  
  const mockProductRepo = { 
    findById: jest.fn<any>(),
    updateStock: jest.fn<any>() 
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Comportamento padrão para passar pela verificação da linha 19 do Service
    mockOrderRepo.findById.mockResolvedValue({ 
      _id: "order_123", 
      status: 'pending',
      toObject: () => ({ _id: "order_123", status: 'pending' }) 
    });

    orderService = new OrderService(
      mockOrderRepo as any, 
      mockProductRepo as any
    );
  });

  describe("updateOrderStatus()", () => {
    test("Deve atualizar status com sucesso (normalizando)", async () => {
      const id = new Types.ObjectId().toString();
      
      // ✅ Ajustado para usar updateStatus
      mockOrderRepo.updateStatus.mockResolvedValue({ _id: id, status: "shipped" });
      
      const result = await orderService.updateOrderStatus(id, "SHIPPED");
      
      expect(result!.status).toBe("shipped");
      // ✅ Verificamos se o método correto foi chamado
      expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith(id, "shipped");
    });

    test("Deve lançar erro para status inválido", async () => {
      await expect(orderService.updateOrderStatus("id", "status_inexistente"))
        .rejects.toThrow(/inválido/); 
    });
  });

  describe("Listagens", () => {
    test("listAllOrders deve retornar todos os pedidos", async () => {
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
});