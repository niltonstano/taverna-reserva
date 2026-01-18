import { jest } from '@jest/globals';
import { FastifyReply, FastifyRequest } from 'fastify';
import { CustomerController } from '../../src/controllers/customer.controller.js';
import { CustomerService } from '../../src/services/customer.service.js';

describe('CustomerController', () => {
  let controller: CustomerController;
  let mockCustomerService: jest.Mocked<CustomerService>;
  let mockReply: jest.Mocked<FastifyReply>;

  beforeEach(() => {
    // Mock do Service
    mockCustomerService = {
      getById: jest.fn(),
    } as any;

    controller = new CustomerController(mockCustomerService);

    // Mock do Reply do Fastify
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;
  });

  describe('getProfile', () => {
    test('deve retornar o perfil do cliente com sucesso', async () => {
      const mockCustomer = { id: '123', name: 'Nilton', email: 'nilton@test.com' };
      const mockRequest = {
        params: { id: '123' }
      } as any;

      mockCustomerService.getById.mockResolvedValue(mockCustomer as any);

      await controller.getProfile(mockRequest, mockReply);

      expect(mockCustomerService.getById).toHaveBeenCalledWith('123');
      expect(mockReply.send).toHaveBeenCalledWith(mockCustomer);
    });

    test('deve retornar 404 se o cliente não for encontrado', async () => {
      const mockRequest = {
        params: { id: 'nao-existe' }
      } as any;

      mockCustomerService.getById.mockResolvedValue(null);

      await controller.getProfile(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Usuário não encontrado'
      }));
    });
  });

  describe('logout', () => {
    test('deve retornar mensagem de sucesso no logout', async () => {
      const mockRequest = {} as any;

      await controller.logout(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Sessão encerrada com sucesso'
      });
    });
  });
});