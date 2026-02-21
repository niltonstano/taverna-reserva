import { FastifyReply, FastifyRequest } from "fastify";
import logger from "../plugins/logger.js";

/**
 * ✅ DEFINIÇÃO DE TIPOS PARA O JWT
 * Garante que o TypeScript reconheça o payload em todo o projeto.
 */
export enum UserRole {
  ADMIN = "admin",
  CUSTOMER = "customer",
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * 1. AUTENTICAÇÃO JWT (Authentication)
 * Blindagem de entrada: se falhar aqui, nem encosta nos Services.
 */
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    // Injeta os dados no request.user (configurado no fastify-jwt)
    await request.jwtVerify();

    // Log silencioso de auditoria em produção
    logger.debug(
      { userId: (request.user as JWTPayload).id },
      "Usuário autenticado",
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Token inválido";

    logger.warn(
      { err: message, ip: request.ip, url: request.url },
      "Tentativa de acesso não autorizado",
    );

    return reply.status(401).send({
      success: false,
      message: "Sessão inválida ou expirada.",
    });
  }
};

/**
 * 2. RBAC (Role-Based Access Control)
 * Validação de permissões por cargo.
 */
export const verifyRole = (allowedRoles: UserRole[]) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const user = request.user as JWTPayload | undefined;

    if (!user || !allowedRoles.includes(user.role)) {
      logger.error(
        { userId: user?.id, roleFound: user?.role, required: allowedRoles },
        "BLOQUEIO RBAC: Permissão insuficiente",
      );

      return reply.status(403).send({
        success: false,
        message:
          "Acesso negado. Você não tem permissão para realizar esta ação.",
      });
    }
  };
};

/**
 * 3. AUTORIZAÇÃO DE PROPRIEDADE (Ownership)
 * Garante que um cliente só acesse seus próprios Pedidos/Carrinho.
 * Admins ignoram essa trava.
 */
export const authorizeOwnership = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const user = request.user as JWTPayload | undefined;
  // Captura o ID tanto de params (ex: /orders/:id) quanto de query
  const { id: resourceId } = (request.params as { id: string }) || {};

  if (!user)
    return reply
      .status(401)
      .send({ success: false, message: "Não autenticado." });

  const isOwner = user.id === resourceId;
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    logger.warn(
      { userId: user.id, resourceId, action: "OWNERSHIP_VIOLATION" },
      "Tentativa de acesso a recurso alheio",
    );

    return reply.status(403).send({
      success: false,
      message: "Acesso negado. Este recurso não pertence à sua conta.",
    });
  }
};

/**
 * 4. SHORTCUTS PARA ROTAS
 */
export const adminOnly = verifyRole([UserRole.ADMIN]);
export const customerOnly = verifyRole([UserRole.CUSTOMER]);
export const anyRole = verifyRole([UserRole.ADMIN, UserRole.CUSTOMER]);
