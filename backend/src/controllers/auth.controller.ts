import { FastifyReply, FastifyRequest } from "fastify";
import { LoginDTO, RegisterDTO } from "../schemas/auth.schema.js";
import { AuthService } from "../services/auth.service.js";
import { JWTPayload, UserRole } from "../types/auth.type.js";

/**
 * 🏰 AuthController: Gerencia o fluxo de identidade da Taverna.
 * Design Pattern: Controller com Arrow Functions para garantir Binding Automático.
 */
export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  /**
   * ✅ Login Administrativo
   */
  adminLogin = async (request: FastifyRequest, reply: FastifyReply) => {
    return this.executeLogin(request, reply, "admin");
  };

  /**
   * ✅ Login de Cliente
   */
  customerLogin = async (request: FastifyRequest, reply: FastifyReply) => {
    return this.executeLogin(request, reply, "customer");
  };

  /**
   * ✅ Registro Administrativo
   */
  adminRegister = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await this.authService.registerAdmin(
      request.body as RegisterDTO,
    );
    return reply.status(201).send({ success: true, user });
  };

  /**
   * ✅ Registro de Cliente
   */
  customerRegister = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await this.authService.registerCustomer(
      request.body as RegisterDTO,
    );
    return reply.status(201).send({ success: true, user });
  };

  /**
   * 🔒 Método Privado Auxiliar (Encapsulado para evitar exposição de rotas)
   * Centraliza a assinatura de JWT e headers de segurança.
   */
  private executeLogin = async (
    request: FastifyRequest,
    reply: FastifyReply,
    type: UserRole,
  ) => {
    const { email, password } = request.body as LoginDTO;

    const result = await this.authService.login(
      email,
      password,
      type,
      async (payload: JWTPayload) =>
        reply.jwtSign(payload, {
          expiresIn: "8h",
          iss: "taverna-reserva-api",
          sub: payload.id,
        }),
    );

    // Cache-Control: no-store é crucial para respostas que contêm tokens JWT
    return reply.status(200).header("Cache-Control", "no-store").send(result);
  };
}
