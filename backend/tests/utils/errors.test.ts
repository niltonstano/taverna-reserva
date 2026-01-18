import { describe, it, expect } from "@jest/globals";
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from "../../src/utils/errors.js";

describe("Error Classes", () => {
  describe("AppError", () => {
    it("deve criar um erro com status code padrão 500", () => {
      const error = new AppError("Erro genérico");
      expect(error.message).toBe("Erro genérico");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it("deve criar um erro com status code customizado", () => {
      const error = new AppError("Erro customizado", 418);
      expect(error.statusCode).toBe(418);
    });
  });

  describe("ValidationError", () => {
    it("deve ter status code 400", () => {
      const error = new ValidationError("Dados inválidos");
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Dados inválidos");
    });
  });

  describe("NotFoundError", () => {
    it("deve ter status code 404", () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Recurso não encontrado");
    });

    it("deve aceitar mensagem customizada", () => {
      const error = new NotFoundError("Usuário não encontrado");
      expect(error.message).toBe("Usuário não encontrado");
    });
  });

  describe("UnauthorizedError", () => {
    it("deve ter status code 401", () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Não autorizado");
    });
  });

  describe("ForbiddenError", () => {
    it("deve ter status code 403", () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Acesso negado");
    });
  });

  describe("ConflictError", () => {
    it("deve ter status code 409", () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe("Conflito");
    });
  });
});
