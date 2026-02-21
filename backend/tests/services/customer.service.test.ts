/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Types } from "mongoose";
import { CustomerService } from "../../src/services/customer.service.js";
import { BadRequestError, NotFoundError } from "../../src/utils/errors.js";

describe("👥 CustomerService - Unidade", () => {
  let customerService: CustomerService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllNoPagination: jest.fn(),
      delete: jest.fn(),
    };

    // Injetando o mock no service
    customerService = new CustomerService(mockRepository);
    jest.clearAllMocks();
  });

  describe("getById", () => {
    test("Deve retornar um cliente quando o ID é válido e existe", async () => {
      const validId = new Types.ObjectId().toString();
      const mockCustomer = { _id: validId, name: "Nilton" };
      mockRepository.findById.mockResolvedValue(mockCustomer);

      const result = await customerService.getById(validId);

      expect(result).toEqual(mockCustomer);
      expect(mockRepository.findById).toHaveBeenCalledWith(validId);
    });

    test("Deve lançar BadRequestError se o formato do ID for inválido", async () => {
      const invalidId = "id-zuado";

      await expect(customerService.getById(invalidId)).rejects.toThrow(
        BadRequestError,
      );
    });

    test("Deve lançar NotFoundError se o cliente não existir", async () => {
      const validId = new Types.ObjectId().toString();
      mockRepository.findById.mockResolvedValue(null);

      await expect(customerService.getById(validId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("getAll (Paginação)", () => {
    test("Deve aplicar limites seguros e calcular páginas corretamente", async () => {
      mockRepository.findAll.mockResolvedValue({
        customers: [{ name: "Cliente 1" }],
        total: 15,
      });

      // Testando com limite alto (deve baixar para 100) e página negativa (deve subir para 1)
      const result = await customerService.getAll(-5, 500);

      expect(result.pagination.limit).toBe(100);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pages).toBe(1); // ceil(15/100) = 1
      expect(mockRepository.findAll).toHaveBeenCalledWith(1, 100);
    });

    test("Deve retornar a estrutura correta de paginação", async () => {
      mockRepository.findAll.mockResolvedValue({
        customers: [],
        total: 50,
      });

      const result = await customerService.getAll(1, 20);

      expect(result.pagination.total).toBe(50);
      expect(result.pagination.pages).toBe(3); // ceil(50/20) = 3
    });
  });

  describe("delete", () => {
    test("Deve deletar com sucesso um ID válido", async () => {
      const validId = new Types.ObjectId().toString();
      mockRepository.delete.mockResolvedValue(true);

      await expect(customerService.delete(validId)).resolves.not.toThrow();
      expect(mockRepository.delete).toHaveBeenCalledWith(validId);
    });

    test("Deve lançar NotFoundError se tentar deletar algo que não existe", async () => {
      const validId = new Types.ObjectId().toString();
      mockRepository.delete.mockResolvedValue(false);

      await expect(customerService.delete(validId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
