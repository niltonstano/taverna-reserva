export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    public override readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requisição inválida.") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito de estado.") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(
    public details: any,
    message = "Erro de validação.",
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Erro interno no servidor.") {
    super(message, 500, "INTERNAL_SERVER_ERROR");
  }
}
