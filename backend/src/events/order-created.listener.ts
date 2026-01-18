import { ClientSession, FilterQuery, Model, Types } from "mongoose";
import {
  IProduct,
  IProductDocument,
  ProductModel,
} from "../models/product.model.js";

// Definimos um tipo para o retorno que inclui o _id como string ou ObjectId
// Isso resolve o conflito com FlattenMaps
type ProductResult = IProduct & { _id: Types.ObjectId };

export class ProductRepository {
  constructor(private readonly model: Model<IProductDocument> = ProductModel) {}

  /**
   * Busca paginada
   * Retorna IProduct[] puro para evitar overhead do Mongoose
   */
  async findPaginated(
    page: number,
    limit: number,
    searchTerm?: string
  ): Promise<{ data: ProductResult[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: FilterQuery<IProductDocument> = { active: true };

    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ProductResult[]>() // Tipagem forçada no lean
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { data, total };
  }

  /**
   * Baixa de estoque ATÔMICA
   */
  async updateStock(
    id: string,
    quantity: number,
    session?: ClientSession
  ): Promise<ProductResult | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    // Usamos cast 'as any' ou tipagem genérica para o findOneAndUpdate com lean
    return (await this.model
      .findOneAndUpdate(
        { _id: id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true, session, lean: true }
      )
      .exec()) as ProductResult | null;
  }

  async findById(id: string): Promise<ProductResult | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean<ProductResult>().exec();
  }

  /**
   * No create, o Mongoose sempre retorna o Document, então mantemos a tipagem original
   */
  async create(data: Partial<IProduct>): Promise<IProductDocument> {
    const [product] = await this.model.create([data]);
    return product;
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.model.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }
}
