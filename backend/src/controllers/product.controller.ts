import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { IProduct } from "../models/product.model.js";
import {
  productIdSchema,
  productQuerySchema,
  productSchema,
} from "../schemas/product.schema.js";
import { ProductService } from "../services/product.service.js";

// Tipagens Inferidas dos Schemas Zod
export type ProductInput = z.infer<typeof productSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductParams = z.infer<typeof productIdSchema>;

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * 1. LISTAR PRODUTOS (Público)
   * Sanitização contra NoSQL Injection no termo de busca
   */
  findAll = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = productQuerySchema.parse(request.query);
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
      const search = query.searchTerm?.replace(/[$.]/g, "");

      const result = await this.productService.list(page, limit, search);

      return reply.status(200).send({
        data: result.products,
        total: result.total,
        page,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: "Erro ao carregar catálogo." });
    }
  };

  /**
   * 2. BUSCAR UM RÓTULO (Público)
   */
  findOne = async (
    request: FastifyRequest<{ Params: ProductParams }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = productIdSchema.parse(request.params);
      const product = await this.productService.findById(id);

      if (!product) {
        return reply.status(404).send({ message: "Vinho não encontrado." });
      }

      return reply.status(200).send(product);
    } catch (error) {
      return reply.status(400).send({ message: "ID fornecido é inválido." });
    }
  };

  /**
   * 3. CRIAR RÓTULO (Admin Only)
   */
  create = async (
    request: FastifyRequest<{ Body: ProductInput }>,
    reply: FastifyReply
  ) => {
    try {
      const cleanBody = productSchema.parse(request.body);

      // ✅ Tipagem Forte: Convertemos para unknown e depois para IProduct
      // Isso resolve a incompatibilidade de 'null' do Zod vs 'undefined' do Mongoose
      const product = await this.productService.create(
        cleanBody as unknown as IProduct
      );

      return reply.status(201).send(product);
    } catch (error) {
      request.log.error(error);
      return reply
        .status(422)
        .send({ message: "Dados do produto são inválidos." });
    }
  };

  /**
   * 4. ATUALIZAR RÓTULO (Admin Only)
   */
  update = async (
    request: FastifyRequest<{
      Params: ProductParams;
      Body: Partial<ProductInput>;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = productIdSchema.parse(request.params);
      const cleanBody = productSchema.partial().parse(request.body);

      // ✅ Tipagem Forte: Partial<IProduct> garante que apenas campos válidos sejam atualizados
      const product = await this.productService.update(
        id,
        cleanBody as unknown as Partial<IProduct>
      );

      return reply.status(200).send(product);
    } catch (error) {
      request.log.error(error);
      return reply
        .status(400)
        .send({ message: "Falha na atualização do rótulo." });
    }
  };

  /**
   * 5. EXCLUIR RÓTULO (Admin Only)
   */
  delete = async (
    request: FastifyRequest<{ Params: ProductParams }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = productIdSchema.parse(request.params);
      await this.productService.delete(id);

      return reply.status(200).send({
        success: true,
        message: "Rótulo removido com sucesso.",
      });
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send({ message: "Erro ao tentar remover o rótulo." });
    }
  };

  /**
   * 6. SEED (Admin Only)
   */
  seed = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await this.productService.seed();
      return reply.status(200).send({
        message: "Catálogo restaurado com sucesso!",
        imported: result.imported,
      });
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send({ message: "Falha ao restaurar o catálogo." });
    }
  };

  /**
   * 7. TOGGLE OFFER (Admin Only)
   */
  toggleOffer = async (
    request: FastifyRequest<{ Params: ProductParams }>,
    reply: FastifyReply
  ) => {
    try {
      const { id } = productIdSchema.parse(request.params);
      const product = await this.productService.findById(id);

      if (!product) {
        return reply
          .status(404)
          .send({ success: false, message: "Vinho não encontrado." });
      }

      const newStatus = !(product.emOferta ?? false);
      const updatePayload: Partial<IProduct> = { emOferta: newStatus };

      await this.productService.update(id, updatePayload);

      // ✅request.user tipado via JWTPayload
      request.log.info(
        `Admin ${request.user.id} alterou oferta do produto ${id} para ${newStatus}`
      );

      return reply.status(200).send({
        success: true,
        message: newStatus ? "Adicionado às ofertas." : "Removido das ofertas.",
        emOferta: newStatus,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: "Erro ao processar oferta." });
    }
  };
}
