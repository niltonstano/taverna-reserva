import { z } from "zod";

export const CheckoutHeadersSchema = z.object({
  "idempotency-key": z.string().uuid({ message: "UUID obrigatório." }),
});

export const CheckoutBodySchema = z
  .object({
    address: z.string().min(5),
    zipCode: z.string().min(8),
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
          productId: z.string(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1, "O pedido deve ter pelo menos um item."),
  })
  .strict();
