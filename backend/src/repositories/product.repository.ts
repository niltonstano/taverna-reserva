import { ClientSession, Model, Types } from "mongoose";
import { IProductDocument, ProductModel } from "../models/product.model.js";

// Criamos um tipo para o objeto "Lean" (puro)
// Isso remove o erro de FlattenMaps
type IProduct = any; // Ou defina sua interface de dados pura aqui

export class ProductRepository {
  constructor(private readonly model: Model<IProductDocument> = ProductModel) {}

  /**
   * ✅ NÍVEL PRODUÇÃO: Atualização de estoque atômica
   */
  async updateStock(
    productId: string,
    quantity: number,
    session?: ClientSession
  ): Promise<any | null> {
    // Trocamos IProductDocument por any ou sua interface pura
    if (!Types.ObjectId.isValid(productId)) return null;

    const filter =
      quantity < 0
        ? {
            _id: new Types.ObjectId(productId),
            stock: { $gte: Math.abs(quantity) },
          }
        : { _id: new Types.ObjectId(productId) };

    const result = await this.model
      .findOneAndUpdate(
        filter,
        { $inc: { stock: quantity } },
        { session, new: true, lean: true }
      )
      .exec();

    if (!result && quantity < 0) {
      throw new Error(
        `Estoque insuficiente ou produto inexistente: ${productId}`
      );
    }

    return result;
  }

  /**
   * ✅ PAGINAÇÃO DE PRODUÇÃO
   */
  async findPaginated(
    page: number = 1,
    limit: number = 10,
    searchTerm?: string
  ) {
    const skip = (page - 1) * limit;
    const filter = searchTerm
      ? { name: { $regex: searchTerm, $options: "i" }, active: true }
      : { active: true };

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean() // O segredo é não forçar o Document aqui
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { data: data as any[], total };
  }

  async findById(id: string): Promise<any | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).lean().exec();
  }

  async create(data: Partial<IProductDocument>): Promise<any> {
    const [product] = await this.model.create([data]);
    return product.toObject(); // toObject() limpa as funções do Mongoose para o retorno
  }

  async update(
    id: string,
    data: Partial<IProductDocument>
  ): Promise<any | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.model.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async seed(products: any[]) {
    await this.model.deleteMany({});
    const result = await this.model.insertMany(products);
    return { imported: result.length };
  }
}
