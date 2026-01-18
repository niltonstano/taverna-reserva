import { z } from "zod";

/**
 * 🔐 REGRAS DE SENHA (Segurança Máxima)
 */
const passwordRules = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial");

/**
 * ✅ Schema de Registro
 */
export const registerSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres").max(100),
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  password: passwordRules,
  permissions: z.array(z.string()).optional(),
});

/**
 * ✅ Schema de Login
 */
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Tipos Exportados para uso no AuthService e Controllers
export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;