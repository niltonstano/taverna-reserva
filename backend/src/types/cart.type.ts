import { FastifyReply, FastifyRequest } from "fastify";

// --- 1. Estrutura de Dados do Produto no Carrinho ---
export interface CartProductData {
  _id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  image?: string;
  // ✅ Campos essenciais para logística (Melhor Envio)
  weight: number;
  dimensions: {
    width: number;
    height: number;
    length: number;
  };
}

// --- 2. Estrutura do Item e do Carrinho Populado ---
export interface PopulatedCartItem {
  productId: CartProductData;
  quantity: number;
}

export interface CartResponse {
  _id: string;
  userId: string;
  items: PopulatedCartItem[];
  totalItems: number;
  totalPrice: string;
  updatedAt: string;
}

// --- 3. Interfaces de Requisição (Payloads) ---
export interface CartItemBody {
  productId: string;
  quantity: number;
}

export interface CartParams {
  productId: string;
}

// --- 4. Contrato do Controller ---
export interface ICartController {
  getCart(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void | FastifyReply>;
  addItem(
    request: FastifyRequest<{ Body: CartItemBody }>,
    reply: FastifyReply,
  ): Promise<void | FastifyReply>;
  removeItem(
    request: FastifyRequest<{ Params: CartParams }>,
    reply: FastifyReply,
  ): Promise<void | FastifyReply>;
  clearCart(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void | FastifyReply>;
}
