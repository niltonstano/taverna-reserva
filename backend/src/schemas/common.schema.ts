// src/schemas/common.schema.ts
import { z } from "zod";

/**
 * Schema de validação para parâmetros de paginação
 * Usado em queries de listagem
 */
export const paginationSchema = z.object({
  // Página atual (começa em 1)
  page: z.coerce
    .number()
    .int("Página deve ser um número inteiro")
    .min(1, "Página deve ser no mínimo 1")
    .default(1),

  // Quantidade de itens por página
  limit: z.coerce
    .number()
    .int("Limite deve ser um número inteiro")
    .min(1, "Limite deve ser no mínimo 1")
    .max(100, "Limite máximo é 100 itens")
    .default(20),
});

/**
 * Schema para ordenação (sort)
 */
export const sortSchema = z.object({
  sortBy: z
    .string()
    .optional()
    .default("createdAt"),

  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc"),
});

/**
 * Tipo inferido do schema de paginação
 */
export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Tipo inferido do schema de ordenação
 */
export type SortParams = z.infer<typeof sortSchema>;

/**
 * Interface para resposta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[]; // Array de dados
  pagination: {
    page: number; // Página atual
    limit: number; // Itens por página
    total: number; // Total de registros
    totalPages: number; // Total de páginas
    hasNext: boolean; // Tem próxima página?
    hasPrev: boolean; // Tem página anterior?
  };
}

/**
 * Função helper para criar resposta paginada
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}