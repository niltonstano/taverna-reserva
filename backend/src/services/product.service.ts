import { ProductRepository } from "../repositories/product.repository.js";
import { IProduct, ProductPaginationResult } from "../types/product.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  /**
   * ✅ Normalizador de Categorias: Garante padrão "Vinho", "Espumante" etc.
   */
  private normalizeCategory(category?: string): string {
    if (!category) return "Geral";
    const trimmed = category.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  async list(
    page: number,
    limit: number,
    search?: string,
  ): Promise<ProductPaginationResult> {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

    const { data, total, pages } = await this.productRepository.findPaginated(
      safePage,
      safeLimit,
      search,
    );

    return {
      products: data.map((p) => this.mapToProduct(p)),
      total: total || 0,
      pages: pages || 0,
    };
  }

  async findById(id: string): Promise<IProduct> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundError("Produto não localizado.");
    return this.mapToProduct(product);
  }

  /**
   * ✨ Criação com Normalização
   */
  async create(data: Partial<Omit<IProduct, "_id">>): Promise<IProduct> {
    const productData = {
      ...data,
      category: this.normalizeCategory(data.category),
      name: data.name?.trim(),
    };

    const created = await this.productRepository.create(productData);
    return this.mapToProduct(created);
  }

  /**
   * 🔄 Atualização Parcial com Re-normalização
   */
  async update(
    id: string,
    data: Partial<Omit<IProduct, "_id">>,
  ): Promise<IProduct> {
    const updateData = { ...data };

    if (data.category) {
      updateData.category = this.normalizeCategory(data.category);
    }

    const updated = await this.productRepository.update(id, updateData);
    if (!updated) throw new NotFoundError("Produto não encontrado.");

    return this.mapToProduct(updated);
  }

  /**
   * 🗑️ Deleção com Regra de Negócio (Safety First)
   */
  async delete(id: string): Promise<boolean> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundError("Produto não encontrado.");

    // Impede deletar produtos que ainda têm estoque (evita furos em pedidos)
    if (Number(product.stock) > 0) {
      throw new BadRequestError(
        `Impossível remover: O produto '${product.name}' possui ${product.stock} unidades em estoque.`,
      );
    }

    const success = await this.productRepository.delete(id);
    return !!success;
  }

  /**
   * 🛠️ Data Mapper Pattern (Sanitização de saída)
   */
  private mapToProduct(doc: any): IProduct {
    // Converte documento Mongoose (ou objeto puro) para contrato IProduct
    const raw = doc.toObject ? doc.toObject() : doc;

    return {
      _id: (raw._id || raw.id)?.toString(),
      name: raw.name || "Sem Nome",
      description: raw.description || "",
      price: Number(raw.price) || 0,
      stock: Number(raw.stock) || 0,
      category: raw.category || "Geral",
      imageUrl: raw.imageUrl || "",
      active: Boolean(raw.active),
      weight: Number(raw.weight) || 0,
      dimensions: {
        width: Number(raw.dimensions?.width) || 0,
        height: Number(raw.dimensions?.height) || 0,
        length: Number(raw.dimensions?.length) || 0,
      },
      emOferta: Boolean(raw.emOferta),
      safra: raw.safra || "N/V",
      uva: raw.uva || "Blend",
      origem: raw.origem || "Não Informada",
      pontuacao: raw.pontuacao,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
