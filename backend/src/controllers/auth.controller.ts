import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService, JWTPayload } from "../services/auth.service.js";
import { 
  loginSchema, 
  registerSchema, 
  RegisterDTO, 
  LoginDTO 
} from "../schemas/auth.schema.js";

export class AuthController {
  private authService: AuthService;

  constructor(authService?: AuthService) {
    // Se não passar um service (produção), ele cria um novo
    // Se passar (testes), ele usa o injetado
    this.authService = authService || new AuthService();
  }
  // ... resto do código


  private executeLogin = async (
    request: FastifyRequest, 
    reply: FastifyReply, 
    type: 'admin' | 'customer'
  ) => {
    const validation = loginSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({ 
        success: false, 
        message: "Dados de login inválidos",
        errors: validation.error.format() 
      });
    }

    try {
      const { email, password } = validation.data as LoginDTO;
      
      const result = await this.authService.login(
        email, 
        password, 
        type, 
        async (payload: JWTPayload) => reply.jwtSign(payload, { expiresIn: "8h" })
      );

      return reply.send({ success: true, ...result });
    } catch (error) {
      /* istanbul ignore next */
      const msg = error instanceof Error ? error.message : "Erro na autenticação";
      request.log.warn(`[AUTH ${type.toUpperCase()}] ${msg}`);
      return reply.status(401).send({ 
        success: false, 
        message: "Credenciais inválidas" 
      });
    }
  };

  adminLogin = (req: FastifyRequest, rep: FastifyReply) => 
    this.executeLogin(req, rep, 'admin');

  customerLogin = (req: FastifyRequest, rep: FastifyReply) => 
    this.executeLogin(req, rep, 'customer');

  adminRegister = async (request: FastifyRequest, reply: FastifyReply) => {
    const validation = registerSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({ 
        success: false, 
        errors: validation.error.format() 
      });
    }

    try {
      const data: RegisterDTO = validation.data;
      const result = await this.authService.registerAdmin(data);
      
      return reply.status(201).send({ success: true, user: result });
    } catch (error) {
      /* istanbul ignore next */
      const msg = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : "Erro no registro";
          
      return reply.status(400).send({ success: false, message: msg });
    }
  };

  customerRegister = async (request: FastifyRequest, reply: FastifyReply) => {
    const validation = registerSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({ 
        success: false, 
        errors: validation.error.format() 
      });
    }

    try {
      const data: RegisterDTO = validation.data;
      const result = await this.authService.registerCustomer(data);
      
      return reply.status(201).send({ success: true, user: result });
    } catch (error) {
      /* istanbul ignore next */
      const msg = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : "Erro no registro";

      return reply.status(400).send({ success: false, message: msg });
    }
  };
}