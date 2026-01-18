import { FastifyReply, FastifyRequest } from "fastify";

export enum UserRole {
  ADMIN = "admin",
  CUSTOMER = "customer",
}

/**
 * 1. Autenticação JWT (Verifica se o usuário está logado)
 */
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    await request.jwtVerify();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Token inválido";
    return reply.status(401).send({
      success: false,
      message: "Não autorizado: " + message,
    });
  }
};

/**
 * 2. RBAC (Controle de Acesso Baseado em Cargos)
 */
/**
 * 2. RBAC (Controle de Acesso Baseado em Cargos) - Versão Corrigida
 */
export const verifyRole = (allowedRoles: string[]) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    // Forçamos o tipo para aceitar tanto id quanto _id
    const user = request.user as
      | { id?: string; _id?: string; role?: string }
      | undefined;

    console.log("--- DEBUG DE AUTORIZAÇÃO ---");
    console.log("Usuário extraído do Token:", user);
    console.log("Cargo exigido:", allowedRoles);

    // Verificação de segurança
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      console.error("BLOQUEADO: Usuário sem cargo ou cargo insuficiente.");
      return reply.status(403).send({
        success: false,
        message: "Acesso negado. Cargo insuficiente.",
      });
    }

    console.log("ACESSO PERMITIDO!");
  };
};

/**
 * 3. Autorização de Propriedade (Ownership)
 * Garante que o usuário só altere os próprios dados ou seja ADMIN
 */
export const authorizeOwnership = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const user = request.user as { id: string; role: string } | undefined;
  const { id } = request.params as { id: string };

  if (!user) {
    return reply
      .status(401)
      .send({ success: false, message: "Não autenticado." });
  }

  const isOwner = user.id === id;
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    return reply.status(403).send({
      success: false,
      message:
        "Acesso negado. Você não tem permissão para acessar este recurso.",
    });
  }
};

/**
 * 4. Autorização de Carrinho (Contexto de Negócio)
 */
export const authorizeCart = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const user = request.user as { id: string } | undefined;

  if (!user) {
    return reply
      .status(401)
      .send({ success: false, message: "Sessão expirada." });
  }
};

// Atalhos úteis
export const adminOnly = verifyRole([UserRole.ADMIN]);
export const customerOnly = verifyRole([UserRole.CUSTOMER]);
