import bcrypt from "bcryptjs";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import logger from "../plugins/logger.js";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminService } from "../services/admin.service.js";

// Estendendo o erro para capturar status específicos
interface AppError extends Error {
  statusCode?: number;
}

// Hash fictício para evitar timing attacks em usuários inexistentes
const DUMMY_HASH =
  "$2b$12$K8p9Vf/R.uQ1uB2Y8vF9O.Y8q7XG5V4z3e2r1t0y9u8i7o6p5a4s3";

// --- Schemas ---
const IdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID inválido (MongoDB ObjectID)"),
});

const RegisterSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const LoginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const OrderStatusSchema = z.object({
  status: z.enum(["pendente", "pago", "enviado", "entregue", "cancelado"]),
});

export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminRepository: AdminRepository
  ) {}

  /**
   * Helper Enterprise: Trata erros de forma segura
   */
  private handleError(
    reply: FastifyReply,
    err: unknown,
    context: string
  ): FastifyReply {
    const isAppError = err instanceof Error;
    const statusCode = (err as AppError)?.statusCode || 500;
    const message = isAppError ? err.message : "Erro interno inesperado";

    logger.error(`[AdminController] Erro em ${context}: ${message}`);

    return reply.status(statusCode).send({
      success: false,
      message:
        statusCode === 500 ? "Ocorreu um erro interno no servidor" : message,
    });
  }

  // --- Métodos de Autenticação ---

  adminRegister = async (
    req: FastifyRequest<{ Body: z.infer<typeof RegisterSchema> }>,
    reply: FastifyReply
  ) => {
    try {
      const { name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 12);
      const admin = await this.adminRepository.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      });

      return reply
        .status(201)
        .send({ success: true, data: { id: admin._id, email: admin.email } });
    } catch (err) {
      return this.handleError(reply, err, "adminRegister");
    }
  };

  adminLogin = async (
    req: FastifyRequest<{ Body: z.infer<typeof LoginSchema> }>,
    reply: FastifyReply
  ) => {
    try {
      const { email, password } = req.body;

      // 1. Busca o admin no banco com a senha
      const admin = await this.adminRepository.findByEmailWithPassword(email);

      // 2. Verifica se admin existe
      if (!admin || !admin.password) {
        await bcrypt.compare(password, DUMMY_HASH);
        req.log.warn(`Tentativa de login inválida: ${email}`);
        return reply.status(401).send({
          success: false,
          message: "Falha no acesso. Verifique suas credenciais.",
        });
      }

      // 3. Compara as senhas
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        req.log.warn(`Senha incorreta para: ${email}`);
        return reply.status(401).send({
          success: false,
          message: "Falha no acesso. Verifique suas credenciais.",
        });
      }

      // 4. Gera o Token JWT
      const token = await reply.jwtSign({
        id: String(admin._id),
        email: admin.email,
        role: admin.role || "admin",
      });

      // ENVIA TOKEN E DADOS DO USUÁRIO (Essencial para o Frontend)
      return reply.status(200).send({
        success: true,
        token,
        user: {
          _id: String(admin._id),
          name: admin.name,
          email: admin.email,
          role: admin.role || "admin",
        },
      });
    } catch (err) {
      return this.handleError(reply, err, "adminLogin");
    }
  };

  // --- Métodos de Perfil e Pedidos ---

  getAdminProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const profile = await this.adminService.getAdminProfile(req.user.id);
      return reply.status(200).send({ success: true, data: profile });
    } catch (err) {
      return this.handleError(reply, err, "getAdminProfile");
    }
  };

  getAllOrders = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const orders = await this.adminService.listAllOrders();
      return reply.status(200).send({ success: true, data: orders });
    } catch (err) {
      return this.handleError(reply, err, "getAllOrders");
    }
  };

  updateOrderStatus = async (
    req: FastifyRequest<{
      Params: z.infer<typeof IdParamSchema>;
      Body: z.infer<typeof OrderStatusSchema>;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const updated = await this.adminService.updateOrder(
        req.params.id,
        req.body.status
      );
      return reply.status(200).send({ success: true, data: updated });
    } catch (err) {
      return this.handleError(reply, err, "updateOrderStatus");
    }
  };

  // --- Métodos de Usuários e Produtos ---

  getAllUsers = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await this.adminService.listAllUsers();
      return reply.status(200).send({ success: true, data: users });
    } catch (err) {
      return this.handleError(reply, err, "getAllUsers");
    }
  };

  deleteUser = async (
    req: FastifyRequest<{ Params: z.infer<typeof IdParamSchema> }>,
    reply: FastifyReply
  ) => {
    try {
      await this.adminService.removeUser(req.params.id);
      return reply
        .status(200)
        .send({ success: true, message: "Usuário removido" });
    } catch (err) {
      return this.handleError(reply, err, "deleteUser");
    }
  };

  getAllProducts = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const products = await this.adminService.listAllProducts();
      return reply.status(200).send({ success: true, data: products });
    } catch (err) {
      return this.handleError(reply, err, "getAllProducts");
    }
  };

  deleteProduct = async (
    req: FastifyRequest<{ Params: z.infer<typeof IdParamSchema> }>,
    reply: FastifyReply
  ) => {
    try {
      await this.adminService.removeProduct(req.params.id);
      return reply
        .status(200)
        .send({ success: true, message: "Produto removido" });
    } catch (err) {
      return this.handleError(reply, err, "deleteProduct");
    }
  };
}
