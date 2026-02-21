import { ClientSession, Model, Types } from "mongoose";
import { IOrderDB, OrderModel } from "../models/order.model.js";
import { IOrderDTO, IOrderEntity, OrderStatus } from "../types/order.type.js";

export class OrderRepository {
  constructor(private readonly model: Model<IOrderDB> = OrderModel) {}

  /**
   * 🛠️ MAPPER (Data Transfer Object)
   */
  private mapToDTO(doc: any): IOrderDTO {
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : doc;

    return {
      id: String(obj._id || obj.id),
      userId: String(obj.userId),
      customerEmail: obj.customerEmail || "",
      idempotencyKey: obj.idempotencyKey || "",
      items: (obj.items || []).map((item: any) => ({
        productId: String(item.productId),
        name: item.name || "Produto Indisponível",
        quantity: Number(item.quantity),
        priceCents: Number(item.priceCents),
        subtotalCents: Number(item.subtotalCents),
      })),
      totalPriceCents: Number(obj.totalPriceCents),
      shippingPriceCents: Number(obj.shippingPriceCents),
      status: obj.status as OrderStatus,
      address: obj.address || "",
      zipCode: obj.zipCode || "",
      shipping: {
        service: obj.shipping?.service || "",
        company: obj.shipping?.company || "Transportadora",
        priceCents: Number(obj.shipping?.priceCents) || 0,
        deadline: obj.shipping?.deadline || "",
      },
      createdAt: obj.createdAt?.toISOString?.() || String(obj.createdAt),
      updatedAt: obj.updatedAt?.toISOString?.() || String(obj.updatedAt),
    };
  }

  /**
   * 🛡️ BUSCA POR IDEMPOTÊNCIA
   */
  async findByIdempotencyKey(
    userId: string,
    key: string,
  ): Promise<IOrderDTO | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    const doc = await this.model
      .findOne({ userId: new Types.ObjectId(userId), idempotencyKey: key })
      .lean()
      .exec();

    return doc ? this.mapToDTO(doc) : null;
  }

  /**
   * 📦 CRIAÇÃO (Atomic & Idempotent Safe)
   * Double-check resolve colisões de race condition sem blocos catch poluídos.
   */
  async create(
    data: IOrderEntity,
    session?: ClientSession,
  ): Promise<IOrderDTO> {
    const existing = await this.model
      .findOne({ userId: data.userId, idempotencyKey: data.idempotencyKey })
      .session(session || null)
      .exec();

    if (existing) return this.mapToDTO(existing);

    const [order] = await this.model.create([data], { session });

    return this.mapToDTO(order);
  }

  /**
   * 🔍 BUSCA POR ID
   */
  async findById(id: string): Promise<IOrderDTO | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findById(id).lean().exec();
    return doc ? this.mapToDTO(doc) : null;
  }

  /**
   * 🔄 ATUALIZAÇÃO DE STATUS
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    session?: ClientSession,
  ): Promise<IOrderDTO | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const doc = await this.model
      .findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, session, runValidators: true, lean: true },
      )
      .exec();

    return doc ? this.mapToDTO(doc) : null;
  }

  /**
   * 👤 HISTÓRICO POR USUÁRIO
   */
  async findByUserId(userId: string): Promise<IOrderDTO[]> {
    if (!Types.ObjectId.isValid(userId)) return [];

    const docs = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return docs.map((doc) => this.mapToDTO(doc));
  }

  /**
   * 🔍 LISTAGEM PAGINADA (ADMIN)
   */
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (Math.max(1, page) - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(),
    ]);

    return {
      data: docs.map((doc) => this.mapToDTO(doc)),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  }
}
