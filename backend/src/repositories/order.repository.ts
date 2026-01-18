import { ClientSession, Types } from "mongoose";
import { IOrderDocument, OrderModel } from "../models/order.model.js";

/**
 * ✅ INTERFACE DE ITENS: Alinhada com o Model
 */
export interface OrderItem {
  productId: string; // Usamos string para facilitar o transporte no JSON
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/**
 * ✅ INTERFACE BASE: Unificação total para totalPrice
 */
interface OrderBase {
  userId: Types.ObjectId;
  items: OrderItem[];
  totalPrice: number; // 👈 Aqui estava o conflito. Agora padronizado.
  status: string;
  idempotencyKey: string;
  customerEmail: string;
  shippingAddress?: string;
  zipCode?: string;
}

export interface OrderCreateInput extends OrderBase {}

export interface OrderReadModel extends OrderBase {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * --- REPOSITÓRIO: ACESSO AO BANCO ---
 */
export class OrderRepository {
  /**
   * ✅ PROTEÇÃO DE IDEMPOTÊNCIA
   */
  async findByIdempotencyKey(
    userId: string,
    idempotencyKey: string
  ): Promise<OrderReadModel | null> {
    if (!Types.ObjectId.isValid(userId)) return null;

    return OrderModel.findOne({
      userId: new Types.ObjectId(userId),
      idempotencyKey,
    })
      .lean<OrderReadModel>()
      .exec();
  }

  /**
   * ✅ CRIAÇÃO ATÔMICA (ACID)
   */
  async create(
    data: OrderCreateInput,
    options?: { session: ClientSession }
  ): Promise<IOrderDocument> {
    // Garantimos que os dados seguem o Schema com totalPrice
    const [order] = await OrderModel.create([data], {
      session: options?.session,
    });
    return order;
  }

  /**
   * ✅ BUSCA COM PAGINAÇÃO (ADMIN)
   */
  async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<OrderReadModel[]> {
    const skip = (page - 1) * limit;

    return OrderModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<OrderReadModel[]>()
      .exec();
  }

  /**
   * ✅ MEUS PEDIDOS (CLIENTE)
   */
  async findByUserId(userId: string): Promise<OrderReadModel[]> {
    if (!Types.ObjectId.isValid(userId)) return [];

    return OrderModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean<OrderReadModel[]>()
      .exec();
  }

  async findById(id: string): Promise<OrderReadModel | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return OrderModel.findById(id).lean<OrderReadModel>().exec();
  }

  /**
   * ✅ ATUALIZAÇÃO DE STATUS
   */
  async updateStatus(
    id: string,
    status: string,
    session?: ClientSession
  ): Promise<OrderReadModel | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return OrderModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      {
        new: true,
        lean: true,
        session,
      }
    ).exec() as Promise<OrderReadModel | null>;
  }
}
