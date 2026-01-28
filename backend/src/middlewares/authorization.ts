import { FastifyReply, FastifyRequest } from "fastify";
import logger from "../plugins/logger.js"; // Ajustado o path relativo comum

export enum UserRole {
  ADMIN = "admin",
  CUSTOMER = "customer",
}

/**
 * 1. Autenticação JWT
 * Verifica se o token é válido e injeta os dados em request.user
 */
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    await request.jwtVerify();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Token inválido";

    logger.warn(
      { err: message, ip: request.ip },
      "Tentativa de acesso com token inválido",
    );

    return reply.status(401).send({
      success: false,
      message: "Não autorizado: " + message,
    });
  }
};

/**
 * 2. RBAC (Controle de Acesso Baseado em Cargos)
 * Verifica se o cargo (role) do usuário está na lista de permissões
 */
export const verifyRole = (allowedRoles: string[]) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const user = request.user as
      | { id?: string; _id?: string; role?: string }
      | undefined;

    // Log estruturado para auditoria
    logger.info(
      {
        userId: user?.id || user?._id,
        userRole: user?.role,
        requiredRoles: allowedRoles,
      },
      "Checando permissões de cargo",
    );

    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      logger.error(
        {
          userId: user?.id || user?._id,
          roleFound: user?.role,
        },
        "BLOQUEADO: Cargo insuficiente",
      );

      return reply.status(403).send({
        success: false,
        message: "Acesso negado. Cargo insuficiente.",
      });
    }

    logger.info({ userId: user.id || user._id }, "Acesso autorizado por cargo");
  };
};

/**
 * 3. Autorização de Propriedade (Ownership)
 * Garante que o usuário só altere seus próprios dados ou seja um ADMIN
 */
export const authorizeOwnership = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const user = request.user as { id: string; role: string } | undefined;
  const { id } = request.params as { id: string };

  if (!user) {
    return reply
      .status(401)
      .send({ success: false, message: "Não autenticado." });
  }

  const isOwner = user.id === id || (user as any)._id === id;
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    logger.warn(
      { userId: user.id, resourceId: id },
      "Tentativa de acesso a recurso de outro usuário",
    );

    return reply.status(403).send({
      success: false,
      message: "Acesso negado. Você não tem permissão para este recurso.",
    });
  }
};

/**
 * 4. Autorização de Carrinho
 */
export const authorizeCart = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const user = request.user as { id: string } | undefined;

  if (!user) {
    return reply
      .status(401)
      .send({ success: false, message: "Sessão expirada." });
  }
};

// --- Atalhos de Middleware ---
export const adminOnly = verifyRole([UserRole.ADMIN]);
export const customerOnly = verifyRole([UserRole.CUSTOMER]);
