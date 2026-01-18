import { ProductModel } from "../models/product.model.js";
import { CustomerModel } from "../models/customer.model.js";
import { AdminModel, IAdmin } from "../models/admin.js";
import { OrderModel } from "../models/order.model.js";

export class AdminRepository {
  // --- Admin Auth & Profile ---
  async findById(id: string): Promise<IAdmin | null> {
    return await AdminModel.findById(id).select('-password');
  }

  // Adicione isto no AdminRepository
async findByEmail(email: string): Promise<IAdmin | null> {
  return await AdminModel.findOne({ email }).select('-password');
}

  async findByEmailWithPassword(email: string): Promise<IAdmin | null> {
    return await AdminModel.findOne({ email }).select('+password');
  }

  async create(data: Partial<IAdmin>): Promise<IAdmin> {
    return await AdminModel.create(data);
  }

  // --- Pedidos (Orders) ---
  async findAllOrders() {
    // Retorna todos os pedidos populando os dados básicos do cliente
    return await OrderModel.find().populate('userId', 'name email');
  }

  async updateOrderStatus(orderId: string, status: string) {
    return await OrderModel.findByIdAndUpdate(
      orderId, 
      { status }, 
      { new: true }
    );
  }

  // --- Usuários (Customers) ---
  async findAllUsers() {
    // Retorna todos os clientes cadastrados omitindo a senha
    return await CustomerModel.find().select('-password');
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await CustomerModel.findByIdAndDelete(id);
    return !!result;
  }

  // --- Produtos (Products) ---
  async findProductById(id: string) {
    return await ProductModel.findById(id);
  }

  async findAllProducts() {
    // Método essencial para o Dashboard do Admin
    return await ProductModel.find({});
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id);
    return !!result;
  }
}