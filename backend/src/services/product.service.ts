import { IProductDocument } from "../models/product.model.js";
import { ProductRepository } from "../repositories/product.repository.js";

interface PaginatedProducts {
  products: IProductDocument[];
  total: number;
}

export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async list(
    page: number,
    limit: number,
    searchTerm?: string
  ): Promise<PaginatedProducts> {
    const { data, total } = await this.productRepository.findPaginated(
      page,
      limit,
      searchTerm
    );
    return { products: data, total };
  }

  async findById(id: string): Promise<IProductDocument | null> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new Error("Produto não encontrado.");
    return product;
  }

  async create(data: Partial<IProductDocument>): Promise<IProductDocument> {
    return await this.productRepository.create(data);
  }

  async update(
    id: string,
    data: Partial<IProductDocument>
  ): Promise<IProductDocument | null> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new Error("Produto não encontrado para atualização.");
    return await this.productRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new Error("Produto não encontrado para exclusão.");
    return await this.productRepository.delete(id);
  }

  async seed(): Promise<{ imported: number }> {
    // Definimos explicitamente como Partial<IProductDocument> para o TS validar
    const initialProducts: Partial<IProductDocument>[] = [
      {
        name: "Melini Chianti Riserva",
        safra: "2021",
        origem: "Toscana, Itália",
        price: 189.0,
        image_url: "/vinhos/melini-chianti.webp",
        category: "Tinto",
        uva: "Sangiovese",
        description: "Um clássico da Toscana com notas de cereja madura.",
        pontuacao: 92,
        active: true,
        stock: 15,
        emOferta: false,
      },
      {
        name: "Château Teyssier Grand Cru",
        safra: "2018",
        origem: "Bordeaux, França",
        price: 890.0,
        image_url: "/vinhos/chateau-teyssier.webp",
        category: "Tinto",
        uva: "Merlot",
        description: "Elegância francesa com taninos sedosos.",
        pontuacao: 96,
        emOferta: true,
        active: true,
        stock: 8,
      },
      {
        name: "Cono Sur Reserva Especial",
        safra: "2021",
        origem: "Casablanca, Chile",
        price: 198.0,
        image_url: "/vinhos/cono-sur.webp",
        category: "Branco",
        uva: "Chardonnay",
        description: "Frescor cítrico vibrante.",
        pontuacao: 90,
        emOferta: true,
        active: true,
        stock: 20,
      },
      {
        name: "Rioja Reserva Especial",
        safra: "2016",
        origem: "Rioja, Espanha",
        price: 420.0,
        image_url: "/vinhos/rioja.webp",
        category: "Tinto",
        uva: "Tempranillo",
        description: "Potente e clássico, notas de baunilha.",
        pontuacao: 95,
        active: true,
        stock: 12,
        emOferta: false,
      },
      {
        name: "Don David Reserve",
        safra: "2020",
        origem: "Salta, Argentina",
        price: 245.0,
        image_url: "/vinhos/don-davud.webp",
        category: "Tinto",
        uva: "Malbec",
        description: "Vinho de altitude com notas de ameixa.",
        pontuacao: 91,
        emOferta: true,
        active: true,
        stock: 25,
      },
      {
        name: "Bourgogne Pinot Noir",
        safra: "2020",
        origem: "Borgonha, França",
        price: 580.0,
        image_url: "/vinhos/bourgogne.webp",
        category: "Tinto",
        uva: "Pinot Noir",
        description: "A delicadeza da Borgonha.",
        pontuacao: 92,
        active: true,
        stock: 10,
        emOferta: false,
      },
    ];

    return await this.productRepository.seed(initialProducts);
  }
}
