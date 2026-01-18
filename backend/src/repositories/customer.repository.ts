import { CustomerModel, ICustomerData } from "../models/customer.model.js";

export class CustomerRepository {
  /**
   * Busca um cliente por e-mail, incluindo a senha (útil para o Auth Service).
   */
  public async findByEmail(email: string): Promise<ICustomerData | null> {
    return await CustomerModel.findOne({ email })
      .select("+password") 
      .lean()
      .exec() as ICustomerData | null;
  }

  /**
   * Busca um cliente por ID.
   */
  public async findById(id: string): Promise<ICustomerData | null> {
    return await CustomerModel.findById(id)
      .lean()
      .exec() as ICustomerData | null;
  }

  /**
   * Retorna todos os clientes.
   */
  public async findAll(): Promise<ICustomerData[]> {
    return await CustomerModel.find().lean().exec() as ICustomerData[];
  }

  /**
   * Cria um novo cliente.
   */
  public async create(data: Partial<ICustomerData>): Promise<ICustomerData> {
    const customer = await CustomerModel.create(data);
    return customer.toObject();
  }

  /**
   * Atualiza um cliente existente.
   */
  public async update(id: string, data: Partial<ICustomerData>): Promise<ICustomerData | null> {
    return await CustomerModel.findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec() as ICustomerData | null;
  }

  /**
   * Remove um cliente do banco de dados.
   */
  public async delete(id: string): Promise<ICustomerData | null> {
    return await CustomerModel.findByIdAndDelete(id)
      .lean()
      .exec() as ICustomerData | null;
  }
}