import { z } from "zod";

export const CheckoutHeadersSchema = z
  .object({
    "idempotency-key": z.string().uuid({ message: "UUID obrigatório." }),
  })
  .passthrough();

export const CheckoutBodySchema = z
  .object({
    address: z.string().min(5),
    zipCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido."),
    total: z.number().positive(),
    shipping: z.object({
      service: z.string(),
      price: z.number().nonnegative(),
      deadline: z.number().int(),
      company: z.string().default("Transportadora"),
    }),
    items: z
      .array(
        z.object({
          productId: z
            .string()
            .regex(/^[a-f\d]{24}$/i, "ID de produto inválido."),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1, "O pedido deve ter pelo menos um item."),
  })
  .strict();
