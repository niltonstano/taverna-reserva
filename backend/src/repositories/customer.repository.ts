import { CustomerModel, ICustomerData } from "../models/customer.model.js";

export class CustomerRepository {
  /**
   * ✅ Versão Produção: Busca paginada com ordenação
   * @param skip Número de registros a pular
   * @param limit Número de registros a retornar
   */
  public async findAll(
    skip: number = 0,
    limit: number = 50,
  ): Promise<ICustomerData[]> {
    return (await CustomerModel.find()
      .sort({ createdAt: -1 }) // Mais recentes primeiro
      .skip(skip)
      .limit(limit)
      .lean() // Performance: retorna POJO (Plain Old JavaScript Objects)
      .exec()) as ICustomerData[];
  }

  /**
   * Busca um cliente por e-mail, incluindo a senha (necessário para Login).
   */
  public async findByEmail(email: string): Promise<ICustomerData | null> {
    return (await CustomerModel.findOne({ email })
      .select("+password")
      .lean()
      .exec()) as ICustomerData | null;
  }

  /**
   * Busca um cliente por ID.
   */
  public async findById(id: string): Promise<ICustomerData | null> {
    return (await CustomerModel.findById(id)
      .lean()
      .exec()) as ICustomerData | null;
  }

  /**
   * Cria um novo cliente.
   */
  public async create(data: Partial<ICustomerData>): Promise<ICustomerData> {
    const customer = await CustomerModel.create(data);
    return customer.toObject();
  }

  /**
   * Atualiza um cliente existente por ID.
   */
  public async update(
    id: string,
    data: Partial<ICustomerData>,
  ): Promise<ICustomerData | null> {
    return (await CustomerModel.findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec()) as ICustomerData | null;
  }

  /**
   * Remove um cliente do banco de dados por ID.
   */
  public async delete(id: string): Promise<ICustomerData | null> {
    return (await CustomerModel.findByIdAndDelete(id)
      .lean()
      .exec()) as ICustomerData | null;
  }
}
