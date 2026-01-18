import { jest } from '@jest/globals';
import { FastifyReply, FastifyRequest } from 'fastify';
import { OrderController } from '../../src/controllers/order.controller.js';
import { OrderService } from '../../src/services/order.service.js';
import { CheckoutService } from '../../src/services/checkout.service.js';

describe('OrderController', () => {
  let controller: OrderController;
  let mockOrderService: jest.Mocked<OrderService>;
  let mockCheckoutService: jest.Mocked<CheckoutService>;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: jest.Mocked<FastifyReply>;

  beforeEach(() => {
    mockOrderService = {
      listUserOrders: jest.fn(),
      getOrderById: jest.fn(),
      listAllOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
    } as any;

    mockCheckoutService = {
      execute: jest.fn(),
    } as any;

    controller = new OrderController(mockOrderService, mockCheckoutService);

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;

    // ✅ CORREÇÃO: Adicionado 'email' para bater com a interface JWTPayload
    mockRequest = {
      user: { 
        id: 'user123', 
        email: 'test@example.com', // Campo obrigatório adicionado
        role: 'customer' 
      },
      headers: { 'idempotency-key': 'test-key' },
      params: {},
      body: {}
    };
  });

  test('checkout - deve realizar checkout com sucesso', async () => {
    mockCheckoutService.execute.mockResolvedValue({ id: 'order1' } as any);
    
    await controller.checkout(mockRequest as FastifyRequest, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(201);
    expect(mockCheckoutService.execute).toHaveBeenCalledWith('user123', expect.any(String));
  });

  test('updateStatus - deve atualizar status via admin', async () => {
    mockRequest.params = { id: 'order1' };
    mockRequest.body = { status: 'pago' };
    mockOrderService.updateOrderStatus.mockResolvedValue({ id: 'order1', status: 'pago' } as any);
    
    await controller.updateStatus(mockRequest as FastifyRequest, mockReply);
    
    expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith('order1', 'pago');
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});