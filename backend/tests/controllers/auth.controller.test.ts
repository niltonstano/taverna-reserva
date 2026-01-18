import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AuthController } from '../../src/controllers/auth.controller.js';

describe("AuthController - Cobertura Total 100%", () => {
  let controller: AuthController;
  let mockReq: any;
  let mockReply: any;
  let mockService: any;

  const validRegistrationData = {
    name: "Nilton Dev",
    email: "nilton@example.com",
    password: "Password123!",
    confirmPassword: "Password123!"
  };

  const validLoginData = { 
    email: "teste@teste.com", 
    password: "Password123!" 
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController();
    
    mockService = {
      registerAdmin: jest.fn(),
      registerCustomer: jest.fn(),
      login: jest.fn()
    };
    
    (controller as any).authService = mockService;

    mockReq = {
      body: {},
      log: { warn: jest.fn() }
    };

    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      jwtSign: jest.fn().mockImplementation((payload: any, options: any) => "token_fake_123")
    };
  });

  // --- Caminhos de Sucesso ---
  
  it("deve realizar login de ADMIN e assinar o JWT", async () => {
    mockReq.body = validLoginData;
    
    mockService.login.mockImplementation(async (email: any, pass: any, type: any, signFn: any) => {
      const token = await signFn({ id: '1', role: 'admin' });
      return { user: { id: "1" }, token };
    });
    
    await controller.adminLogin(mockReq, mockReply);
    
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({ 
      success: true, 
      token: "token_fake_123" 
    }));
  });

  it("deve realizar login de CUSTOMER com sucesso", async () => {
    mockReq.body = validLoginData;
    mockService.login.mockImplementation(async (email: any, pass: any, type: any, signFn: any) => {
      const token = await signFn({ id: '2', role: 'customer' });
      return { user: { id: "2" }, token };
    });
    
    await controller.customerLogin(mockReq, mockReply);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("deve registrar CUSTOMER com sucesso", async () => {
    mockReq.body = validRegistrationData;
    mockService.registerCustomer.mockResolvedValue({ id: "cust-123" });
    
    await controller.customerRegister(mockReq, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(201);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // --- Caminhos de Erro e Validação ---

  it("deve retornar 400 se o corpo do login estiver incompleto", async () => {
    mockReq.body = { email: "invalido" };
    await controller.customerLogin(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(400);
  });

  it("deve tratar erro de credenciais inválidas (401) no login", async () => {
    mockReq.body = validLoginData;
    mockService.login.mockRejectedValue(new Error("Invalid credentials"));
    
    await controller.adminLogin(mockReq, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("deve tratar erro genérico (string) no registro de customer", async () => {
    mockReq.body = validRegistrationData;
    mockService.registerCustomer.mockRejectedValue("Email já cadastrado");
    
    await controller.customerRegister(mockReq, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({ 
      message: "Email já cadastrado" 
    }));
  });

  it("deve testar o adminRegister com sucesso e erro Zod", async () => {
    // Sucesso
    mockReq.body = validRegistrationData;
    mockService.registerAdmin.mockResolvedValue({ id: "adm-1" });
    await controller.adminRegister(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(201);

    // Erro Zod
    mockReq.body = {}; 
    await controller.adminRegister(mockReq, mockReply);
    expect(mockReply.status).toHaveBeenCalledWith(400);
  });
});