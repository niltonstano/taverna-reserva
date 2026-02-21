import { z } from "zod";

/**
 * 🔐 REGRAS DE SENHA (Segurança Máxima)
 * Centralizado para facilitar futuras alterações (ex: aumentar min caracteres)
 */
const passwordRules = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número")
  .regex(
    /[^A-Za-z0-9]/,
    "A senha deve conter pelo menos um caractere especial",
  );

/**
 * 👤 SCHEMA DO USUÁRIO PÚBLICO
 * Define exatamente o que pode ser enviado para o Front-end.
 * Resolve o erro de serialização ao mapear '_id' para 'id'.
 */
export const publicUserSchema = z.object({
  id: z.string().describe("ID único do usuário"),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "customer"]).describe("Nível de acesso"),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

/**
 * 📥 SCHEMAS DE ENTRADA (Requests)
 */

// Registro de Usuário
export const registerSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres").max(100),
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  password: passwordRules,
  permissions: z.array(z.string()).optional().default([]),
});

// Login de Usuário
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  password: z.string().min(1, "Senha é obrigatória"),
});

/**
 * 📤 SCHEMAS DE SAÍDA (Responses)
 * Utilizados no campo 'response' das rotas do Fastify para validação e documentação.
 */

// Resposta de Autenticação (Login/Register bem-sucedido)
export const authResponseSchema = z.object({
  user: publicUserSchema,
  token: z.string().describe("JWT Token de acesso"),
});

/**
 * 🏷️ TIPOS EXTRAÍDOS (Inference)
 * Evita repetição de código (DRY) ao criar interfaces manualmente.
 */
export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type PublicUserDTO = z.infer<typeof publicUserSchema>;
export type AuthResponseDTO = z.infer<typeof authResponseSchema>;
