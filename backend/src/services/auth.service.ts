import bcrypt from "bcryptjs";
import { Document, Types } from "mongoose";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { AdminRepository } from "../repositories/admin.repository.js";
import { RegisterDTO } from "../schemas/auth.schema.js";

/**
 * Interfaces para Tipagem e Contratos
 */
export interface IBaseUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface UserResponse {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export class AuthService {
  private readonly SALT_ROUNDS = 12;

  /**
   * Construtor com Injeção de Dependência (DI)
   */
  constructor(
    private customerRepository = new CustomerRepository(),
    private adminRepository = new AdminRepository()
  ) {}

  /**
   * Converte para objeto plano apenas se o dado for uma instância Document do Mongoose.
   */
  private ensurePlainObject<T extends IBaseUser>(doc: T): IBaseUser {
    if (doc instanceof Document) {
      return doc.toObject({ getters: true, versionKey: false }) as IBaseUser;
    }
    return doc;
  }

  async login(
    email: string, 
    password: string, 
    type: 'admin' | 'customer',
    signToken: (payload: JWTPayload) => Promise<string>
  ): Promise<AuthResponse> {
    
    // Busca conforme o tipo e método específico existente nos repositórios
    const user = type === 'admin' 
      ? await this.adminRepository.findByEmailWithPassword(email) as IBaseUser | null
      : await this.customerRepository.findByEmail(email) as IBaseUser | null;

    if (!user || !user.password) {
      throw new Error("Credenciais inválidas");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Credenciais inválidas");
    }

    const plainUser = this.ensurePlainObject(user);

    const token = await signToken({ 
      id: plainUser._id.toString(), 
      email: plainUser.email,
      role: type
    });

    return { 
      user: {
        _id: plainUser._id,
        name: plainUser.name,
        email: plainUser.email,
        role: type
      }, 
      token 
    };
  }

  async registerCustomer(data: RegisterDTO): Promise<UserResponse> {
    const exists = await this.customerRepository.findByEmail(data.email);
    if (exists) throw new Error("E-mail já cadastrado");

    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);
    const userDoc = await this.customerRepository.create({ 
      ...data, 
      password: hashedPassword 
    }) as IBaseUser;

    const plain = this.ensurePlainObject(userDoc);
    return {
      _id: plain._id,
      name: plain.name,
      email: plain.email,
      role: 'customer'
    };
  }

  async registerAdmin(data: RegisterDTO): Promise<UserResponse> {
    // CORREÇÃO: Alterado para findByEmailWithPassword para coincidir com o AdminRepository
    const exists = await this.adminRepository.findByEmailWithPassword(data.email);
    
    if (exists) throw new Error("E-mail admin já cadastrado");

    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);
    const userDoc = await this.adminRepository.create({ 
      ...data, 
      password: hashedPassword 
    }) as IBaseUser;

    const plain = this.ensurePlainObject(userDoc);
    return {
      _id: plain._id,
      name: plain.name,
      email: plain.email,
      role: 'admin'
    };
  }
}