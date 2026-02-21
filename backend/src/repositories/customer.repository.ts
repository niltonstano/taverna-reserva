// repositories/customer.repository.ts
import { CustomerModel, ICustomer } from "../models/customer.model.js";

export interface PaginatedCustomers {
  customers: any[];
  total: number;
}

export class CustomerRepository {
  /**
   * ✅ Criação: Normaliza e salva.
   */
  public async create(data: Partial<ICustomer>): Promise<ICustomer> {
    return await CustomerModel.create({
      ...data,
      email: data.email?.toLowerCase().trim(),
    });
  }

  /**
   * ✅ Login: Força a vinda da senha para validação do bcrypt.
   */
  public async findByEmail(email: string) {
    return await CustomerModel.findOne({
      email: email.toLowerCase().trim(),
    })
      .select("+password")
      .exec();
  }

  /**
   * ✅ Busca por ID: Otimizada com lean.
   */
  public async findById(id: string) {
    return await CustomerModel.findById(id, "-password -__v").lean().exec();
  }

  /**
   * ✅ Listagem Sem Paginação: Alta performance.
   */
  public async findAllNoPagination(): Promise<any[]> {
    return await CustomerModel.find({}, "-password -__v")
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  /**
   * ✅ Listagem Paginada: Processamento paralelo para velocidade.
   */
  public async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedCustomers> {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      CustomerModel.find({}, "-password -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      CustomerModel.countDocuments(),
    ]);

    return { customers, total };
  }

  /**
   * ✅ Deleção.
   */
  public async delete(id: string): Promise<boolean> {
    const result = await CustomerModel.findByIdAndDelete(id).exec();
    return !!result;
  }
}
