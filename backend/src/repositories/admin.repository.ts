import { AdminModel, IAdmin } from "../models/admin.js";
import { CustomerModel } from "../models/customer.model.js";
import { OrderModel } from "../models/order.model.js";
import { ProductModel } from "../models/product.model.js";

/**
 * Repository para operações administrativas.
 * Implementa melhores práticas de performance (lean) e segurança.
 */
export class AdminRepository {
  // --- 🔐 Autenticação e Perfil do Admin ---

  /**
   * Busca um administrador por ID removendo a senha.
   */
  async findById(id: string): Promise<IAdmin | null> {
    return await AdminModel.findById(id)
      .select("-password")
      .lean<IAdmin>()
      .exec();
  }

  /**
   * Busca por e-mail sanitizado (sem senha).
   */
  async findByEmail(email: string): Promise<IAdmin | null> {
    return await AdminModel.findOne({
      email: email.toLowerCase().trim(),
    })
      .select("-password")
      .lean<IAdmin>()
      .exec();
  }

  /**
   * ✅ Uso exclusivo do AuthService no login.
   * Força a vinda da senha para comparação do bcrypt.
   */
  async findByEmailWithPassword(email: string): Promise<IAdmin | null> {
    return await AdminModel.findOne({
      email: email.toLowerCase().trim(),
    })
      .select("+password")
      .exec(); // Aqui não usamos .lean() para manter os métodos do Mongoose se necessário
  }

  /**
   * Cria um novo administrador (geralmente via seed ou admin mestre).
   */
  async create(data: Partial<IAdmin>): Promise<IAdmin> {
    return await AdminModel.create({
      ...data,
      email: data.email?.toLowerCase().trim(),
    });
  }

  // --- 📦 Gestão de Pedidos (Orders) ---

  /**
   * Retorna todos os pedidos da loja com dados do cliente.
   * Blindado contra 'MissingSchemaError' usando referência direta ao Model.
   */
  async findAllOrders() {
    return await OrderModel.find()
      .populate({
        path: "userId",
        model: CustomerModel, // Força o Mongoose a usar o modelo correto
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async updateOrderStatus(orderId: string, status: string) {
    return await OrderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();
  }

  // --- 👥 Gestão de Usuários (Customers) ---

  async findAllUsers() {
    return await CustomerModel.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await CustomerModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  // --- 🍷 Gestão de Produtos (Products) ---

  async findProductById(id: string) {
    return await ProductModel.findById(id).lean().exec();
  }

  async findAllProducts() {
    return await ProductModel.find({})
      .sort({ category: 1, name: 1 })
      .lean()
      .exec();
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id).exec();
    return !!result;
  }
}
