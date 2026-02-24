import { Types } from "mongoose";

/** * 🍷 IProduct (Contrato de Domínio)
 * Definida de forma estrita para bater com as exigências do Controller.
 * Campos que o Controller exige como 'string' não podem ter '?' aqui.
 */
export interface IProduct {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  active: boolean;
  emOferta: boolean;
  safra: string;
  uva: string;
  origem: string;
  pontuacao: number;
  featured: boolean;
  imageUrl?: string;
}

/** * 📦 IProductLean (Persistência)
 * O que o MongoDB retorna (inclui IDs e Timestamps).
 */
export interface IProductLean extends IProduct {
  _id: string | Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/** 📊 Resultado de Listagem Paginada */
export interface ProductPaginationResult {
  products: IProductLean[];
  total: number;
  pages: number;
}

/* ===================== DTOs PARA O FASTIFY (CONTRATOS) ===================== */

/**
 * Interface para a rota de listagem (GET /)
 * Querystring tipada para garantir que page/limit sejam tratados como números.
 */
export interface ProductQuery {
  Querystring: {
    page: number;
    limit: number;
    searchTerm?: string;
  };
}

/**
 * Interface para criação (POST /)
 * Exige o objeto IProduct completo.
 */
export interface CreateProductRequest {
  Body: IProduct;
}

/**
 * Interface para atualização (PUT / :id)
 * O Partial<IProduct> permite que o TS aceite envios parciais na edição.
 */
export interface UpdateProductRequest {
  Params: { id: string };
  Body: Partial<IProduct>;
}

/**
 * Interface para rotas que dependem apenas de ID (GET /:id, DELETE /:id, PATCH /:id/...)
 */
export interface IdOnlyRequest {
  Params: { id: string };
}

/**
 * Interface para itens de carrinho populados
 */
export interface ICartItemPopulated {
  productId: IProductLean;
  quantity: number;
}
