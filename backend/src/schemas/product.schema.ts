import { z } from "zod";

/**
 * Helper para limpar dados vindos do Frontend.
 * Transforma strings vazias em undefined para que o .default() do Zod funcione.
 */
const stringClean = (defaultValue: string) =>
  z
    .preprocess(
      (val) =>
        val === "" || val === null || val === undefined ? undefined : val,
      z.string().optional()
    )
    .default(defaultValue);

const numberClean = (defaultValue: number) =>
  z
    .preprocess(
      (val) =>
        val === "" || val === null || val === undefined ? undefined : val,
      z.coerce.number().optional()
    )
    .default(defaultValue);

export const productSchema = z.object({
  // Campos Obrigatórios
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  price: z.coerce.number().positive("O preço deve ser maior que zero"),
  category: z.string().min(1, "A categoria é obrigatória"),

  // Campos Opcionais com Tratamento de String Vazia e Valores Default
  image_url: stringClean("/vinhos/rioja.webp"),
  description: stringClean(""),
  safra: stringClean("N/V"),
  uva: stringClean("Varietal"),
  origem: stringClean("Internacional"),

  // Campos Numéricos e Booleanos
  pontuacao: numberClean(0),
  stock: numberClean(10),
  emOferta: z.preprocess((val) => !!val, z.boolean().default(false)),
  active: z.preprocess(
    (val) => (val === undefined ? true : !!val),
    z.boolean().default(true)
  ),
  featured: z.boolean().optional().default(false),
});

/**
 * 2. Schema para Query Params (Busca e Paginação)
 */
export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  searchTerm: z.string().optional(),
});

/**
 * 3. Schema para ID (Validação de formato MongoDB)
 */
export const productIdSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "ID inválido. Formato MongoDB esperado."),
});

/**
 * 4. Schemas de Resposta (Documentação e Segurança)
 */
export const listProductsResponseSchema = z.object({
  data: z.array(z.any()),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

export const productResponseSchema = z.any();
