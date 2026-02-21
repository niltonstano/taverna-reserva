import { z } from "zod";

// --- PARTE 1: SCHEMAS BASE ---

export const orderStatusSchema = z.enum([
  "pending",
  "paid",
  "shipped",
  "delivered",
  "canceled",
]);

const orderItemSchema = z.object({
  productId: z.string().min(1, "O ID do produto é obrigatório"),
  quantity: z.number().int().min(1, "A quantidade mínima é 1"),
});

const shippingSchema = z.object({
  service: z.string(),
  company: z.string(),
  price: z.number(),
  deadline: z.number(),
});

// --- PARTE 2: SCHEMAS DE REQUISIÇÃO (VALIDAÇÃO) ---

// 🛡️ Validação dos Headers (Obrigatório para o Checkout)
export const orderHeadersSchema = z
  .object({
    "idempotency-key": z
      .string()
      .min(10, "A chave de idempotência deve ter pelo menos 10 caracteres"),
  })
  .passthrough(); // Permite outros headers como Authorization e Content-Type

// 📦 Validação do Body (Dados do Pedido)
export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, "O pedido deve ter pelo menos um item"),
  total: z.number().min(0, "O total não pode ser negativo"),
  address: z.string().min(5, "Endereço completo é obrigatório"),
  zipCode: z.string().min(8, "CEP inválido"),
  shipping: shippingSchema,
});

export const updateOrderSchema = z.object({
  status: orderStatusSchema,
});

export const orderIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID do pedido inválido"),
});

// --- PARTE 3: TIPAGEM (DTOs) ---

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;
export type UpdateOrderDTO = z.infer<typeof updateOrderSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
