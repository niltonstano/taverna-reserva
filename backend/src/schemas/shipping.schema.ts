import { z } from "zod";

export const shippingCalcSchema = {
  body: z.object({
    cep: z
      .string()
      .trim()
      .min(8, "CEP muito curto")
      .max(9, "CEP muito longo")
      .regex(/^\d{5}-?\d{3}$/, "Formato de CEP inválido"),

    items: z
      .array(
        z
          .object({
            _id: z.string().min(1, "ID do produto é obrigatório"),
            quantity: z
              .number()
              .int()
              .positive("A quantidade deve ser maior que zero"),
          })
          .passthrough(),
      )
      .min(1, "O carrinho não pode estar vazio"),
  }),
};

export type ShippingCalcInput = z.infer<typeof shippingCalcSchema.body>;
