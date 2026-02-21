import bcrypt from "bcryptjs";
import { FastifyReply, FastifyRequest } from "fastify";
import mongoose from "mongoose";
import { z } from "zod";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminService } from "../services/admin.service.js";

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

  // ---------- AUTH ----------

  adminRegister = async (
    req: FastifyRequest<{ Body: z.infer<typeof RegisterSchema> }>,
    reply: FastifyReply,
  ) => {
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
  };

  adminLogin = async (
    req: FastifyRequest<{ Body: z.infer<typeof LoginSchema> }>,
    reply: FastifyReply,
  ) => {
    const { email, password } = LoginSchema.parse(req.body);
    const admin = await this.adminRepository.findByEmailWithPassword(email);

    if (!admin || !admin.password) {
      await bcrypt.compare(password, DUMMY_HASH);
      return reply
        .status(401)
        .send({
          success: false,
          message: "Falha no acesso. Verifique suas credenciais.",
        });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return reply
        .status(401)
        .send({
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
  };

  // ---------- PROFILE ----------

  getAdminProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    const adminId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return reply
        .status(401)
        .send({ success: false, message: "Token inválido." });
    }

    const profile = await this.adminService.getAdminProfile(adminId);

    if (!profile) {
      return reply
        .status(404)
        .send({ success: false, message: "Admin não encontrado." });
    }

    return reply.status(200).send({ success: true, data: profile });
  };

  // ---------- ORDERS ----------

  getAllOrders = async (_req: FastifyRequest, reply: FastifyReply) => {
    const orders = await this.adminService.listAllOrders();
    return reply.status(200).send({ success: true, data: orders });
  };

  updateOrderStatus = async (
    req: FastifyRequest<{
      Params: z.infer<typeof IdParamSchema>;
      Body: z.infer<typeof OrderStatusSchema>;
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = IdParamSchema.parse(req.params);
    const { status } = OrderStatusSchema.parse(req.body);

    const updated = await this.adminService.updateOrder(id, status);
    return reply.status(200).send({ success: true, data: updated });
  };

  // ---------- USERS ----------

  getAllUsers = async (_req: FastifyRequest, reply: FastifyReply) => {
    const users = await this.adminService.listAllUsers();
    return reply.status(200).send({ success: true, data: users });
  };

  deleteUser = async (
    req: FastifyRequest<{ Params: z.infer<typeof IdParamSchema> }>,
    reply: FastifyReply,
  ) => {
    const { id } = IdParamSchema.parse(req.params);
    await this.adminService.removeUser(id);

    return reply
      .status(200)
      .send({ success: true, message: "Usuário removido" });
  };

  // ---------- PRODUCTS ----------

  getAllProducts = async (_req: FastifyRequest, reply: FastifyReply) => {
    const products = await this.adminService.listAllProducts();
    return reply.status(200).send({ success: true, data: products });
  };

  deleteProduct = async (
    req: FastifyRequest<{ Params: z.infer<typeof IdParamSchema> }>,
    reply: FastifyReply,
  ) => {
    const { id } = IdParamSchema.parse(req.params);
    await this.adminService.removeProduct(id);

    return reply
      .status(200)
      .send({ success: true, message: "Produto removido" });
  };
}
