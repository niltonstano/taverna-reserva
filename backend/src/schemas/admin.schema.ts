import { z } from "zod";

export const ProductSchema = z.object({
  _id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  category: z.string(),
  image_url: z.string().url().optional().or(z.literal("")),
  emOferta: z.boolean().default(false),
});

export type AdminProduct = z.infer<typeof ProductSchema>;
