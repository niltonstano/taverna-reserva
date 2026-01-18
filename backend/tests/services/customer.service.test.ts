import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { CustomerService } from "../../src/services/customer.service.js";
import { CustomerRepository } from "../../src/repositories/customer.repository.js";
import { Types } from "mongoose";

// Mock do módulo
jest.mock("../../src/repositories/customer.repository.js");

describe("CustomerService", () => {
  let customerService: CustomerService;
  // Usamos any aqui para evitar o conflito de tipos 'never' do compilador
  let mockCustomerRepository: any;

  beforeEach(() => {
    // Instanciamos o mock
    mockCustomerRepository = new CustomerRepository() as jest.Mocked<CustomerRepository>;
    
    // Injeção de dependência
    customerService = new CustomerService(mockCustomerRepository);
    
    jest.clearAllMocks();
  });

  describe("getById", () => {
    it("deve retornar o cliente formatado sem senha quando encontrado", async () => {
      const customerId = new Types.ObjectId();
      
      const mockUserFromDb = {
        _id: customerId,
        name: "Nilton",
        email: "nilton@example.com",
        password: "hash_secreto",
        toObject: () => ({
          _id: customerId,
          name: "Nilton",
          email: "nilton@example.com",
          password: "hash_secreto"
        })
      };

      // ✅ Usando o cast direto na chamada para ignorar o erro de tipagem 'never'
      jest.spyOn(mockCustomerRepository, 'findById').mockResolvedValue(mockUserFromDb as any);

      const result = await customerService.getById(customerId.toString());

      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(customerId.toString());
      expect(result).not.toBeNull();
      expect(result?.id).toBe(customerId.toString());
      expect(result).not.toHaveProperty("password");
    });

    it("deve retornar null quando o cliente não for encontrado", async () => {
      jest.spyOn(mockCustomerRepository, 'findById').mockResolvedValue(null);

      const result = await customerService.getById("id-inexistente");

      expect(result).toBeNull();
    });
  });

  describe("getCustomerById (Alias)", () => {
    it("deve chamar o getById internamente", async () => {
      const spy = jest.spyOn(customerService, "getById");
      jest.spyOn(mockCustomerRepository, 'findById').mockResolvedValue(null);

      const testId = new Types.ObjectId().toString();
      await customerService.getCustomerById(testId);

      expect(spy).toHaveBeenCalledWith(testId);
      spy.mockRestore();
    });
  });
});