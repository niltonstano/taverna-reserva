import { jest } from '@jest/globals';
import { CartController } from '../../src/controllers/cart.controller.js';

describe('CartController - Cobertura Total', () => {
  let controller: CartController;
  let mockCartService: any;
  let mockReply: any;

  const createMockRequest = (overrides = {}) => ({
    user: { id: '65a12345678901234567890a' },
    log: { error: jest.fn() }, // ✅ Correção aqui
    body: {},
    params: {},
    headers: {},
    ...overrides
  } as any);

  beforeEach(() => {
    mockCartService = { getCartByUserId: jest.fn(), addItem: jest.fn(), removeItem: jest.fn(), clearCart: jest.fn() };
    controller = new CartController(mockCartService);
    mockReply = { status: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() } as any;
  });

  test('addItem deve retornar 201 em vez de 200', async () => {
    const mockRequest = createMockRequest({ 
      body: { productId: '65a12345678901234567890b', quantity: 1 } 
    });
    mockCartService.addItem.mockResolvedValue({});
    await controller.addItem(mockRequest, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(201); // ✅ Alinhado com o Controller
  });

  test('getCart deve tratar erro com status 400', async () => {
    mockCartService.getCartByUserId.mockRejectedValue(new Error('fail'));
    await controller.getCart(createMockRequest(), mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(400);
  });
});