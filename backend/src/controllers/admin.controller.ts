import bcrypt from "bcryptjs";
import { FastifyReply, FastifyRequest } from "fastify";
import mongoose from "mongoose";
import { z } from "zod";
import logger from "../plugins/logger.js";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminService } from "../services/admin.service.js";

interface AppError extends Error {
  statusCode?: number;
}

const DUMMY_HASH =
  "$2b$12$K8p9Vf/R.uQ1uB2Y8vF9O.Y8q7XG5V4z3e2r1t0y9u8i7o6p5a4s3";

// ---------------- SCHEMAS ----------------

const IdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID inválido (MongoDB ObjectID)"),
});

const RegisterSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const OrderStatusSchema = z.object({
  status: z.enum(["pendente", "pago", "enviado", "entregue", "cancelado"]),
});

// ---------------- CONTROLLER ----------------

export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminRepository: AdminRepository,
  ) {}

  // ---------- ERROR HANDLER ----------
  private handleError(reply: FastifyReply, err: unknown, context: string) {
    const statusCode = (err as AppError)?.statusCode || 500;

    const message =
      statusCode === 500
        ? "Ocorreu um erro interno no servidor"
        : err instanceof Error
          ? err.message
          : "Erro desconhecido";

    // ✅ Log estruturado (Pino friendly)
    logger.error(
      {
        context,
        err: err instanceof Error ? err.message : err,
        stack: err instanceof Error ? err.stack : undefined,
      },
      "AdminController error",
    );

    return reply.status(statusCode).send({
      success: false,
      message,
    });
  }

  // ---------- AUTH ----------

  adminRegister = async (
    req: FastifyRequest<{ Body: z.infer<typeof RegisterSchema> }>,
    reply: FastifyReply,
  ) => {
    try {
      const { name, email, password } = RegisterSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(password, 12);

      const admin = await this.adminRepository.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      });

      return reply.status(201).send({
        success: true,
        data: { id: admin._id, email: admin.email },
      });
    } catch (err) {
      return this.handleError(reply, err, "adminRegister");
    }
  };

  adminLogin = async (
    req: FastifyRequest<{ Body: z.infer<typeof LoginSchema> }>,
    reply: FastifyReply,
  ) => {
    try {
      const { email, password } = LoginSchema.parse(req.body);
      const admin = await this.adminRepository.findByEmailWithPassword(email);

      if (!admin || !admin.password) {
        await bcrypt.compare(password, DUMMY_HASH);
        return reply.status(401).send({
          success: false,
          message: "Falha no acesso. Verifique suas credenciais.",
        });
      }

      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        return reply.status(401).send({
          success: false,
          message: "Falha no acesso. Verifique suas credenciais.",
        });
      }

      const token = await reply.jwtSign({
        id: String(admin._id),
        email: admin.email,
        role: admin.role || "admin",
      });

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

  // ---------- PROFILE (CORRIGIDO) ----------

  getAdminProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminId = req.user.id;

      // 🔒 Proteção contra ObjectId inválido (resolve seu erro 500 nos testes)
      if (!mongoose.Types.ObjectId.isValid(adminId)) {
        return reply.status(401).send({
          success: false,
          message: "Token inválido.",
        });
      }

      const profile = await this.adminService.getAdminProfile(adminId);

      if (!profile) {
        return reply
          .status(404)
          .send({ success: false, message: "Admin não encontrado." });
      }

      return reply.status(200).send({ success: true, data: profile });
    } catch (err) {
      return this.handleError(reply, err, "getAdminProfile");
    }
  };

  // ---------- ORDERS ----------

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
    reply: FastifyReply,
  ) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const { status } = OrderStatusSchema.parse(req.body);

      const updated = await this.adminService.updateOrder(id, status);
      return reply.status(200).send({ success: true, data: updated });
    } catch (err) {
      return this.handleError(reply, err, "updateOrderStatus");
    }
  };

  // ---------- USERS ----------

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
    reply: FastifyReply,
  ) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      await this.adminService.removeUser(id);

      return reply
        .status(200)
        .send({ success: true, message: "Usuário removido" });
    } catch (err) {
      return this.handleError(reply, err, "deleteUser");
    }
  };

  // ---------- PRODUCTS ----------

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
    reply: FastifyReply,
  ) => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      await this.adminService.removeProduct(id);

      return reply
        .status(200)
        .send({ success: true, message: "Produto removido" });
    } catch (err) {
      return this.handleError(reply, err, "deleteProduct");
    }
  };
}
