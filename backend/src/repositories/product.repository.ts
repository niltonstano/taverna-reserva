import { ClientSession, Model, Types } from "mongoose";
import { IProduct, IProductLean } from "../interfaces/product.interface.js";
import { ProductModel } from "../models/product.model.js";

export class ProductRepository {
  constructor(private readonly model: Model<IProduct> = ProductModel) {}

  async findById(id: string): Promise<IProductLean | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return this.model.findById(id).lean<IProductLean>().exec();
  }

  async findPaginated(
    page = 1,
    limit = 10,
    searchTerm?: string,
  ): Promise<{ data: IProductLean[]; total: number }> {
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
        .lean<IProductLean[]>()
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return { data, total };
  }

  /**
   * 🔻 Baixa de estoque com verificação atômica
   */
  async decreaseStock(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(productId)) return false;

    const result = await this.model.updateOne(
      {
        _id: new Types.ObjectId(productId),
        active: true,
        stock: { $gte: quantity },
      },
      { $inc: { stock: -quantity } },
      { session },
    );

    return result.modifiedCount === 1;
  }

  /**
   * 🔺 Reposição de estoque (rollback / cancelamento)
   */
  async increaseStock(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(productId)) return;

    await this.model.updateOne(
      { _id: new Types.ObjectId(productId) },
      { $inc: { stock: quantity } },
      { session },
    );
  }

  /**
   * Método usado pelo CheckoutService
   */
  async updateStock(
    productId: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<boolean> {
    return this.decreaseStock(productId, quantity, session);
  }

  async create(
    data: Partial<IProduct>,
    session?: ClientSession,
  ): Promise<IProductLean> {
    const [created] = await this.model.create([data], { session });

    const product = await this.model
      .findById(created._id)
      .lean<IProductLean>()
      .session(session ?? null)
      .exec();

    if (!product) throw new Error("Erro ao buscar produto após criação");

    return product;
  }

  async update(
    id: string,
    data: Partial<IProduct>,
  ): Promise<IProductLean | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean<IProductLean>()
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await this.model.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  /**
   * 🌱 Seed inicial de produtos
   * Usado apenas para setup inicial ou ambientes de teste
   */
  async seed(
    products: Partial<IProduct>[],
    session?: ClientSession,
  ): Promise<{ imported: number }> {
    if (!products.length) return { imported: 0 };

    const created = await this.model.insertMany(products, { session });
    return { imported: created.length };
  }
}
