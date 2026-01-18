import { AdminRepository } from "../repositories/admin.repository.js";
import { IAdmin } from "../models/admin.js";
import logger from "../plugins/logger.js";

export class AdminServiceError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = "AdminServiceError";
  }
}

export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async getAdminProfile(id: string): Promise<IAdmin> {
    const admin = await this.adminRepository.findById(id);
    if (!admin) throw new AdminServiceError("Administrador não encontrado.", 404);
    return admin;
  }

  async listAllOrders() {
    return await this.adminRepository.findAllOrders();
  }

  async updateOrder(orderId: string, status: string) {
    const updated = await this.adminRepository.updateOrderStatus(orderId, status);
    if (!updated) throw new AdminServiceError("Pedido não encontrado.");
    return updated;
  }

  async listAllUsers() {
    return await this.adminRepository.findAllUsers();
  }

  async listAllProducts() {
    // Busca todos os produtos do catálogo para o Admin
    return await this.adminRepository.findAllProducts();
  }

  async removeUser(userId: string): Promise<void> {
    const success = await this.adminRepository.deleteUser(userId);
    if (!success) throw new AdminServiceError("Usuário não encontrado.");
  }

  async removeProduct(productId: string): Promise<void> {
    const product = await this.adminRepository.findProductById(productId);
    if (!product) throw new AdminServiceError("Produto não encontrado.", 404);

    const success = await this.adminRepository.deleteProduct(productId);
    if (!success) throw new AdminServiceError("Erro ao deletar produto.");
  }
}