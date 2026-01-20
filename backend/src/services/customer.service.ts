import { Document, Types } from "mongoose";
import { ICustomerData } from "../models/customer.model.js";
import { CustomerRepository } from "../repositories/customer.repository.js";

/**
 * Interface para o cliente sanitizado.
 */
export type CustomerWithoutPassword = Omit<
  ICustomerData,
  "password" | "_id"
> & {
  id: string;
};

/**
 * Tipo que representa um Documento do Mongoose.
 */
type CustomerDocument = Document<unknown, {}, ICustomerData> &
  ICustomerData & {
    _id: Types.ObjectId;
  };

export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  public async findAll(
    page: number,
    limit: number,
  ): Promise<CustomerWithoutPassword[]> {
    try {
      const sanitizedPage = Math.max(1, page);
      const sanitizedLimit = Math.min(100, Math.max(1, limit));
      const skip = (sanitizedPage - 1) * sanitizedLimit;

      const users = await this.customerRepository.findAll(skip, sanitizedLimit);

      // Tipagem explícita da lista vinda do repositório
      const customerList = users as (CustomerDocument | ICustomerData)[];

      return customerList.map((user) => this.sanitizeCustomer(user));
    } catch (error) {
      console.error(`[CustomerService] Error in findAll: ${error}`);
      throw new Error("Erro ao listar clientes na base de dados");
    }
  }

  public async getById(id: string): Promise<CustomerWithoutPassword | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    try {
      const user = await this.customerRepository.findById(id);
      if (!user) return null;

      return this.sanitizeCustomer(user as CustomerDocument | ICustomerData);
    } catch (error) {
      console.error(`[CustomerService] Error in getById: ${error}`);
      throw new Error("Erro ao buscar dados do cliente");
    }
  }

  /**
   * Sanitização robusta . Remove campos sensíveis e desnecessários.
   */
  private sanitizeCustomer(
    user: CustomerDocument | ICustomerData,
  ): CustomerWithoutPassword {
    const isMongooseDocument = (
      doc: CustomerDocument | ICustomerData,
    ): doc is CustomerDocument => {
      return typeof (doc as CustomerDocument).toObject === "function";
    };

    // Extraímos o objeto plano. Se for documento, toObject() resolve.
    const plainUser = isMongooseDocument(user)
      ? user.toObject({ getters: true, versionKey: false })
      : user;

    /**
     * Usamos uma tipagem temporária para o destructuring.
     * Isso permite remover password, _id e __v com segurança de tipo.
     */
    const { password, _id, ...rest } = plainUser as ICustomerData & {
      _id?: Types.ObjectId;
      id?: string;
      __v?: number;
    };

    // Define o ID final: prioriza _id do Mongo, caso contrário tenta o campo id (getters)
    const finalId = _id ? _id.toString() : rest.id || "";

    // Removemos o 'id' do rest se ele existir para evitar duplicidade ou conflito com o retorno
    const { id: _, ...safeData } = rest;

    return {
      ...safeData,
      id: finalId,
    } as CustomerWithoutPassword;
  }

  public async getCustomerById(
    id: string,
  ): Promise<CustomerWithoutPassword | null> {
    return this.getById(id);
  }
}
