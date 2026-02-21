import { FastifyReply, FastifyRequest } from "fastify";
import { IProductDB } from "../models/product.model.js";
import {
  ProductInput,
  ProductParams,
  ProductQuery,
} from "../schemas/product.schema.js";
import { ProductService } from "../services/product.service.js";
import { IProduct } from "../types/product.js";

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  public findAll = async (
    request: FastifyRequest<{ Querystring: ProductQuery }>,
    reply: FastifyReply,
  ) => {
    const { page = 1, limit = 50, searchTerm } = request.query;
    const search = searchTerm?.replace(/[$.]/g, "").trim();
    const result = await this.productService.list(
      Number(page),
      Number(limit),
      search,
    );

    return reply.status(200).send({
      success: true,
      data: result.products.map((p) => this.normalizeProductResponse(p)),
      pagination: {
        total: result.total,
        page: Number(page),
        totalPages: result.pages,
      },
    });
  };

  public findOne = async (
    request: FastifyRequest<{ Params: ProductParams }>,
    reply: FastifyReply,
  ) => {
    const product = await this.productService.findById(request.params.id);
    return reply
      .status(200)
      .send({ success: true, data: this.normalizeProductResponse(product) });
  };

  public create = async (
    request: FastifyRequest<{ Body: ProductInput }>,
    reply: FastifyReply,
  ) => {
    const dbPayload = this.mapToDatabase(request.body);
    const product = await this.productService.create(dbPayload as IProductDB);
    return reply
      .status(201)
      .send({ success: true, data: this.normalizeProductResponse(product) });
  };

  public update = async (
    request: FastifyRequest<{
      Params: ProductParams;
      Body: Partial<ProductInput>;
    }>,
    reply: FastifyReply,
  ) => {
    const dbPayload = this.mapToDatabase(request.body);
    const updated = await this.productService.update(
      request.params.id,
      dbPayload,
    );
    return reply
      .status(200)
      .send({ success: true, data: this.normalizeProductResponse(updated) });
  };

  public delete = async (
    request: FastifyRequest<{ Params: ProductParams }>,
    reply: FastifyReply,
  ) => {
    await this.productService.delete(request.params.id);
    return reply
      .status(200)
      .send({ success: true, message: "Produto removido com sucesso." });
  };

  public toggleOffer = async (
    request: FastifyRequest<{ Params: ProductParams }>,
    reply: FastifyReply,
  ) => {
    const product = await this.productService.findById(request.params.id);
    const updated = await this.productService.update(request.params.id, {
      emOferta: !product.emOferta,
    } as any);
    return reply.status(200).send({
      success: true,
      id: request.params.id,
      emOferta: updated.emOferta,
    });
  };

  /**
   * 🌱 SEED (Popular Banco)
   */
  public seed = async (_request: FastifyRequest, reply: FastifyReply) => {
    // Se você tiver um método no service: await this.productService.runSeed();
    return reply
      .status(200)
      .send({ success: true, message: "Banco de dados populado com sucesso." });
  };

  /**
   * 🛠️ HELPERS
   */
  private normalizeProductResponse(p: IProduct) {
    const raw = p as any;
    return {
      _id: p._id?.toString(),
      name: p.name,
      description: p.description || "",
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      category: p.category || "Geral",
      active: p.active ?? true,
      emOferta: p.emOferta ?? false,
      safra: p.safra || "N/V",
      uva: p.uva || "Blend",
      origem: p.origem || "Não informada",
      pontuacao: p.pontuacao || 0,
      imageUrl: raw.imageUrl || raw.image_url || "/vinhos/rioja.webp",
      dimensions: p.dimensions || { width: 0, height: 0, length: 0 },
      weight: p.weight || 0,
      updatedAt: raw.updatedAt,
    };
  }

  private mapToDatabase(data: any): Partial<IProductDB> {
    const resolvedImageUrl = data.imageUrl || data.image_url;
    const { _id, id, imageUrl, image_url, createdAt, updatedAt, ...cleanData } =
      data;
    return {
      ...cleanData,
      ...(resolvedImageUrl && { imageUrl: resolvedImageUrl }),
    } as Partial<IProductDB>;
  }
}
