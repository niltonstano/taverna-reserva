import { CustomerRepository } from "../repositories/customer.repository.js";
import { ICustomerData } from "../models/customer.model.js";

export type CustomerWithoutPassword = Omit<ICustomerData, "password" | "_id"> & {
  id: string;
};

export class CustomerService {
  // ✅ Constructor preparado para receber o repositório via Injeção de Dependência
  constructor(private readonly customerRepository: CustomerRepository) {}

  public async getById(id: string): Promise<CustomerWithoutPassword | null> {
    const user = await this.customerRepository.findById(id);

    if (!user) return null;

    // Converte documento do Mongoose para objeto literal se necessário
    const plainUser = (user as any).toObject ? (user as any).toObject() : user;

    // Remove dados sensíveis de forma segura
    const { password, _id, __v, ...safeData } = plainUser;

    return {
      ...(safeData as any),
      id: _id?.toString() || id,
    };
  }

  // Alias para compatibilidade
  public async getCustomerById(id: string): Promise<CustomerWithoutPassword | null> {
    return this.getById(id);
  }
}