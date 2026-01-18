import { z } from "zod";

export const addItemToCartSchema = z.object({
  productId: z.string().min(1, "ProductId é obrigatório"),
  quantity: z.number().int().positive("Quantidade deve ser um número positivo"),
});

export const removeItemFromCartSchema = z.object({
  productId: z.string().min(1, "ProductId é obrigatório"),
});

export const userIdParamSchema = z.object({
  userId: z.string().min(1, "UserId é obrigatório"),
});

export type AddItemToCartDTO = z.infer<typeof addItemToCartSchema>;
export type RemoveItemFromCartDTO = z.infer<typeof removeItemFromCartSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;

