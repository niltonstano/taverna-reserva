import { z } from "zod";

/**
 * 🧹 HELPERS DE LIMPEZA (Data Sanitization)
 */

// Transforma string vazia em undefined para ativar o .default()
const stringClean = (defaultValue: string) =>
  z
    .preprocess(
      (val) =>
        val === "" || val === null || val === undefined ? undefined : val,
      z.string().optional(),
    )
    .default(defaultValue);

// Converte número com segurança (evita NaN no banco)
const numberClean = (defaultValue: number) =>
  z
    .preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().optional())
    .default(defaultValue);

// Converte boolean com segurança (trata strings "true"/"false")
const booleanClean = (defaultValue: boolean) =>
  z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .default(defaultValue);

/**
 * 📦 1️⃣ SCHEMA DE ENTRADA (Cadastro / Edição / Seed)
 * Aceita tanto image_url quanto imageUrl para evitar erros de validação no Checkout.
 */
export const productSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  price: z.coerce.number().positive("O preço deve ser maior que zero"),
  category: z.string().min(1, "A categoria é obrigatória"),

  // Flexibilidade total para as imagens (Produção)
  image_url: z.string().optional().default("/vinhos/rioja.webp"),
  imageUrl: z.string().optional(),

  description: stringClean(""),
  safra: stringClean("N/V"),
  uva: stringClean("Varietal"),
  origem: stringClean("Internacional"),
  pontuacao: numberClean(0),
  stock: numberClean(10),
  emOferta: booleanClean(false),
  active: booleanClean(true),
  featured: booleanClean(false),
});

/**
 * 📦 2️⃣ SCHEMA DE RESPOSTA (Contrato da API)
 * O que o Frontend recebe. Enviamos os dois para garantir compatibilidade.
 */
export const productResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  description: z.string().optional(),

  // Fornece ambos para o Frontend não quebrar em loops ou carrinhos
  imageUrl: z.string().default("/vinhos/rioja.webp"),
  image_url: z.string().optional(),

  safra: z.string().optional(),
  uva: z.string().optional(),
  origem: z.string().optional(),
  pontuacao: z.number().optional(),
  stock: z.number().optional(),
  emOferta: z.boolean().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),

  // Dados logísticos para o Shipping (Calculo de frete)
  weight: z.number().default(1.5),
  dimensions: z
    .object({
      width: z.number().default(10),
      height: z.number().default(33),
      length: z.number().default(10),
    })
    .optional(),

  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

/**
 * 🔍 3️⃣ QUERIES E PARAMS
 */
export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(12),
  searchTerm: z.string().optional(),
});

export const productIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID inválido"),
});

/**
 * 📜 4️⃣ LISTA PAGINADA (Resposta Final do findAll)
 */
export const listProductsResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.array(productResponseSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

/**
 * 🛠️ 5️⃣ TIPOS EXPORTADOS
 */
export type ProductInput = z.infer<typeof productSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductParams = z.infer<typeof productIdSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
