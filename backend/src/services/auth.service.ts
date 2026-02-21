import bcrypt from "bcryptjs";
import { AdminRepository } from "../repositories/admin.repository.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { RegisterDTO } from "../schemas/auth.schema.js";
import {
  AuthResult,
  IUserFields,
  JWTPayload,
  PublicUser,
  UserRole,
} from "../types/auth.type.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";

/**
 * ✅ AuthService Enterprise: Focado em Segurança Ofensiva e Integridade de Dados.
 */
export class AuthService {
  // 12 rounds balanceia segurança extrema com performance do servidor.
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly customerRepo = new CustomerRepository(),
    private readonly adminRepo = new AdminRepository(),
  ) {}

  /**
   * 🛡️ Data Sanitizer: Garante que NUNCA campos sensíveis (como password)
   * saiam da camada de serviço.
   */
  private mapToPublic(user: IUserFields, role: UserRole): PublicUser {
    return {
      id: user._id?.toString() || "",
      name: user.name.trim(),
      email: user.email.toLowerCase().trim(),
      role,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * ✅ Registro de Cliente com proteção contra Mass Assignment.
   */
  async registerCustomer(data: RegisterDTO): Promise<PublicUser> {
    const email = data.email.toLowerCase().trim();

    if (await this.customerRepo.findByEmail(email)) {
      throw new ConflictError("Este endereço de e-mail já está em uso.");
    }

    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Proteção: Definimos campo a campo para evitar que o usuário envie 'role' ou 'permissions' no DTO
    const user = await this.customerRepo.create({
      name: data.name,
      email: email,
      password: hashedPassword,
      role: "customer" as const, // Força a role correta independente do input
    });

    return this.mapToPublic(user, "customer");
  }

  /**
   * ✅ Registro de Admin com controle estrito de privilégios.
   */
  async registerAdmin(
    data: RegisterDTO & { permissions?: string[] },
  ): Promise<PublicUser> {
    const email = data.email.toLowerCase().trim();

    if (await this.adminRepo.findByEmail(email)) {
      throw new ConflictError("Conta administrativa já existente.");
    }

    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    const user = await this.adminRepo.create({
      name: data.name,
      email: email,
      password: hashedPassword,
      role: "admin" as const,
      permissions: data.permissions || ["read"], // Default seguro: apenas leitura
    });

    return this.mapToPublic(user, "admin");
  }

  /**
   * ✅ Login: Proteção contra Timing Attacks e Cross-Role Authentication.
   */
  async login(
    email: string,
    password: string,
    type: UserRole,
    signToken: (p: JWTPayload) => Promise<string>,
  ): Promise<AuthResult> {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Busca específica por contexto (evita que um e-mail de cliente logue como admin)
    const user =
      type === "admin"
        ? await this.adminRepo.findByEmailWithPassword(cleanEmail)
        : await this.customerRepo.findByEmail(cleanEmail);

    // 2. Proteção contra enumeração: Se o usuário não existe ou a ROLE não bate,
    // executamos o hash de qualquer forma para manter o tempo de resposta constante.
    const isInvalidUser = !user || !user.password || user.role !== type;

    if (isInvalidUser) {
      // Dummy compare para evitar side-channel attacks
      await bcrypt.compare("dummy_pass", "$2b$12$dummyhashdummyhashdummyhash");
      throw new UnauthorizedError(
        "Credenciais inválidas ou acesso não autorizado.",
      );
    }

    // 3. Verificação real da senha (Safe: user e user.password são garantidos aqui)
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedError(
        "Credenciais inválidas ou acesso não autorizado.",
      );
    }

    const publicUser = this.mapToPublic(user, type);

    // 4. Payload Discriminado (Tipagem Forte)
    const tokenPayload: JWTPayload =
      type === "admin"
        ? {
            id: publicUser.id,
            email: publicUser.email,
            role: "admin",
            permissions: (user as any).permissions || [],
          }
        : {
            id: publicUser.id,
            email: publicUser.email,
            role: "customer",
          };

    const token = await signToken(tokenPayload);

    return { token, user: publicUser };
  }
}
