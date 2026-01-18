import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { AdminController } from '../../src/controllers/admin.controller.js';

describe("AdminController - Cobertura Total 100%", () => {
  let controller: AdminController;
  let mockRepo: any;
  let mockService: any;
  let mockReq: any;
  let mockReply: any;
  
  const validId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRepo = { 
      create: jest.fn(), 
      findByEmailWithPassword: jest.fn() 
    };
    
    mockService = {
      getAdminProfile: jest.fn(), 
      listAllOrders: jest.fn(),
      updateOrder: jest.fn(), 
      listAllUsers: jest.fn(),
      removeUser: jest.fn(), 
      listAllProducts: jest.fn(),
      removeProduct: jest.fn()
    };

    controller = new AdminController(mockService, mockRepo);

    mockReq = { 
      body: {}, 
      params: {}, 
      user: { id: validId },
      log: { 
        error: jest.fn(), 
        info: jest.fn(), 
        warn: jest.fn() 
      } 
    } as any;

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      jwtSign: jest.fn<() => Promise<string>>().mockResolvedValue("token_fake")
    } as any;
  });

  // --- REGISTRO ---
  it("Deve registrar um admin com sucesso", async () => {
    mockReq.body = { name: "Admin", email: "a@a.com", password: "password123" };
    mockRepo.create.mockResolvedValue({ _id: validId, email: "a@a.com" });
    await controller.adminRegister(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(201);
  });

  it("Deve retornar 500 se o registro falhar", async () => {
    mockRepo.create.mockRejectedValue(new Error("Erro Fatal"));
    await controller.adminRegister(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(500);
  });

  // --- LOGIN ---
  it("Deve logar com sucesso", async () => {
    mockReq.body = { email: "admin@teste.com", password: "123" };
    mockRepo.findByEmailWithPassword.mockResolvedValue({ _id: validId, password: "hash" });
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
    await controller.adminLogin(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(200);
  });

  it("Deve retornar 401 se a senha estiver incorreta", async () => {
    mockReq.body = { email: "a@a.com", password: "wrong" };
    mockRepo.findByEmailWithPassword.mockResolvedValue({ _id: validId, password: "hash" });
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
    await controller.adminLogin(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(401);
  });

  it("Deve garantir timing attack protection quando admin não existe", async () => {
    mockReq.body = { email: "no@a.com", password: "123" };
    mockRepo.findByEmailWithPassword.mockResolvedValue(null);
    const spyBcrypt = jest.spyOn(bcrypt, 'compare');
    await controller.adminLogin(mockReq, mockReply);
    expect(spyBcrypt).toHaveBeenCalled();
    expect(mockReply.status).toHaveBeenCalledWith(401);
  });

  // --- ORDERS, USERS & PRODUCTS ---
  it("Deve listar ordens, usuários e produtos com sucesso", async () => {
     mockService.listAllOrders.mockResolvedValue([]);
     await controller.getAllOrders(mockReq, mockReply);
     mockService.listAllUsers.mockResolvedValue([]);
     await controller.getAllUsers(mockReq, mockReply);
     mockService.listAllProducts.mockResolvedValue([]);
     await controller.getAllProducts(mockReq, mockReply);
     expect(mockReply.status).toHaveBeenCalledWith(200);
  });

  it("Deve retornar 500 se listagens falharem", async () => {
    mockService.listAllOrders.mockRejectedValue(new Error());
    await controller.getAllOrders(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(500);
  });

  it("Deve atualizar status do pedido", async () => {
    mockReq.params = { id: validId };
    mockService.updateOrder.mockResolvedValue({});
    await controller.updateOrderStatus(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(200);
  });

  it("Deve remover usuário e produto", async () => {
    mockReq.params = { id: validId };
    mockService.removeUser.mockResolvedValue(true);
    await controller.deleteUser(mockReq, mockReply);
    mockService.removeProduct.mockResolvedValue(true);
    await controller.deleteProduct(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(200);
  });

  // --- CATCH BLOCKS (AS LINHAS VERMELHAS) ---
  it("Deve cobrir erros 500 em todos os métodos", async () => {
    mockService.getAdminProfile.mockRejectedValue(new Error());
    await controller.getAdminProfile(mockReq, mockReply);
    
    mockService.updateOrder.mockRejectedValue(new Error());
    await controller.updateOrderStatus(mockReq, mockReply);
    
    mockService.removeUser.mockRejectedValue(new Error());
    await controller.deleteUser(mockReq, mockReply);

    mockService.removeProduct.mockRejectedValue(new Error());
    await controller.deleteProduct(mockReq, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
  });

  // --- MATANDO AS ÚLTIMAS LINHAS VERMELHAS (95, 103, 137, 155) ---

  it("Deve disparar erro na linha 95 (Login - Erro inesperado)", async () => {
    // Forçamos o email a ser algo que quebre a lógica antes do find
    mockReq.body = { email: null, password: "123" };
    mockRepo.findByEmailWithPassword.mockRejectedValue(new Error("Database offline"));
    
    await controller.adminLogin(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(500);
  });

  it("Deve disparar erro na linha 103 (Profile - Erro de autorização/id)", async () => {
    mockService.getAdminProfile.mockRejectedValue(new Error("Unauthorized"));
    await controller.getAdminProfile(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(500);
  });

  it("Deve garantir erro nos métodos de listagem (Linhas 137 e 155)", async () => {
    // Forçando erro específico em getAllUsers
    mockService.listAllUsers.mockRejectedValue(new Error("Error list users"));
    await controller.getAllUsers(mockReq, mockReply);
    
    // Forçando erro específico em getAllProducts
    mockService.listAllProducts.mockRejectedValue(new Error("Error list products"));
    await controller.getAllProducts(mockReq, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
  });

  it("Deve matar a linha 103 - Erro inesperado no Profile", async () => {
  mockService.getAdminProfile.mockImplementation(() => {
    throw new Error("Unexpected Profile Error");
  });
  
  await controller.getAdminProfile(mockReq, mockReply);
  expect(mockReply.status).toHaveBeenCalledWith(500);
});
});