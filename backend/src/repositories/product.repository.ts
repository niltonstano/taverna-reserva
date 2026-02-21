import { ClientSession, FilterQuery, Model, Types } from "mongoose";
import { IProductDB, ProductModel } from "../models/product.model.js";

// Tipagem estrita para garantir que o _id esteja sempre presente no retorno
export type ProductResult = IProductDB & { _id: Types.ObjectId };

export class ProductRepository {
  constructor(private readonly model: Model<IProductDB> = ProductModel) {}

  /**
   * 🔍 Busca paginada com filtro opcional de nome ou categoria
   */
  async findPaginated(
    page: number,
    limit: number,
    searchTerm?: string,
  ): Promise<{ data: ProductResult[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const filter: FilterQuery<IProductDB> = { active: true };

    if (searchTerm) {
      const searchRegex = { $regex: searchTerm, $options: "i" };
      filter.$or = [{ name: searchRegex }, { category: searchRegex }];
    }

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ProductResult[]>()
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /** * 📦 Baixa de estoque segura e atômica
   * Suporta números negativos para reposição (Rollback)
   */
  async updateStock(
    id: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<ProductResult | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    // Se for venda (qty > 0), o filtro exige saldo suficiente ($gte).
    // Se for reposição (qty < 0), o filtro apenas garante que o produto existe e está ativo.
    const filter: FilterQuery<IProductDB> = { _id: id, active: true };
    if (quantity > 0) {
      filter.stock = { $gte: quantity };
    }

    return this.model
      .findOneAndUpdate(
        filter,
        { $inc: { stock: -quantity } },
        { new: true, session, lean: true },
      )
      .exec() as Promise<ProductResult | null>;
  }

  /**
   * 🆔 Busca produto por ID (Apenas ativos)
   */
  async findById(id: string): Promise<ProductResult | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model
      .findOne({ _id: id, active: true })
      .lean<ProductResult>()
      .exec();
  }

  /**
   * 🆕 Cria um novo produto
   * Nota: Usamos array no .create para compatibilidade com Transactions
   */
  async create(
    data: Partial<IProductDB>,
    session?: ClientSession,
  ): Promise<ProductResult> {
    const [product] = await this.model.create([data], { session });
    return product.toObject() as ProductResult;
  }

  /**
   * ✏️ Atualiza dados cadastrais do produto
   */
  async update(
    id: string,
    data: Partial<IProductDB>,
    session?: ClientSession,
  ): Promise<ProductResult | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model
      .findOneAndUpdate(
        { _id: id, active: true },
        { $set: data },
        { new: true, lean: true, session },
      )
      .exec() as Promise<ProductResult | null>;
  }

  /**
   * 🗑️ Soft Delete (Desativa o produto)
   */
  async delete(id: string, session?: ClientSession): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await this.model
      .updateOne({ _id: id }, { $set: { active: false } }, { session })
      .exec();

    return result.modifiedCount > 0;
  }
}
