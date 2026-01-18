import "@fastify/jwt";

declare module "@fastify/jwt" {
  // 1. Definimos o que vem dentro do Token
  interface JWTPayload {
    id: string;
    email: string;
    role: "admin" | "customer";
    permissions?: string[];
  }

  // 2. Dizemos ao Fastify para usar essa estrutura no request.user e no payload
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload; 
  }
}