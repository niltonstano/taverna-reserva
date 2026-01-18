import { z } from "zod";

// --- PARTE 1: SCHEMAS BASE ---

export const orderStatusSchema = z.enum([
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
]);

const orderItemSchema = z.object({
  productId: z.string().min(1, "O ID do produto é obrigatório"),
  quantity: z.number().int().min(1, "A quantidade mínima é 1"),
});

// --- PARTE 2: SCHEMAS DE REQUISIÇÃO (BODY/PARAMS) ---

export const createOrderSchema = z.object({
  // userId opcional se você pegar do token no backend
  userId: z.string().min(1, "O ID do usuário é obrigatório").optional(),
  items: z
    .array(orderItemSchema)
    .min(1, "O pedido deve ter pelo menos um item"),
  total: z.number().min(0, "O total não pode ser negativo"),
  status: orderStatusSchema.default("pending"),
});

export const updateOrderSchema = z.object({
  status: orderStatusSchema,
});

export const orderIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID do pedido inválido"),
});

// Para 'my-orders', como pegamos o ID do token, o schema de validação pode ser um objeto vazio
export const getMyOrdersSchema = z.object({});

// --- PARTE 3: SCHEMAS DE RESPOSTA (O QUE RESOLVE O ERRO 500) ---

/**
 * ✅ Este schema garante que a resposta tenha a chave 'data' como array.
 * Se o Controller enviar algo diferente, o Zod avisa antes de quebrar.
 */
export const listOrdersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(
    z.object({
      _id: z.string(),
      total: z.number(),
      status: orderStatusSchema,
      createdAt: z.any().optional(), // Aceita data ou string do MongoDB
      items: z.array(z.any()).optional(),
    })
  ),
});

// --- PARTE 4: TIPAGEM (DTOs) ---

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;
export type UpdateOrderDTO = z.infer<typeof updateOrderSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
