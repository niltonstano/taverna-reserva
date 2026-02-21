// services/customer.service.ts
import { Types } from "mongoose";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class CustomerService {
  constructor(private readonly customerRepo = new CustomerRepository()) {}

  public async getById(id: string) {
    this.validateObjectId(id);
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw new NotFoundError("Cliente não localizado.");
    return customer;
  }

  public async listAll() {
    return await this.customerRepo.findAllNoPagination();
  }

  public async getAll(page: number = 1, limit: number = 20) {
    const safeLimit = Math.min(Math.max(Number(limit), 1), 100); // Máximo 100 por vez
    const safePage = Math.max(Number(page), 1);

    const { customers, total } = await this.customerRepo.findAll(
      safePage,
      safeLimit,
    );

    return {
      customers,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    };
  }

  public async delete(id: string): Promise<void> {
    this.validateObjectId(id);
    const success = await this.customerRepo.delete(id);
    if (!success) throw new NotFoundError("Cliente não encontrado.");
  }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Formato de ID inválido.");
    }
  }
}
