import axios from "axios";
import { Types } from "mongoose";
import { CartRepository } from "../repositories/cart.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { BadRequestError, InternalServerError } from "../utils/errors.js";

interface MelhorEnvioProduct {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
}

interface MelhorEnvioQuote {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  error?: string;
  company: { name: string; picture: string };
}

export class ShippingService {
  // Mantemos as definições, mas usaremos a URL fixa no método abaixo
  private readonly MELHOR_ENVIO_API =
    process.env.MELHOR_ENVIO_URL || "https://sandbox.melhorenvio.com.br";
  private readonly MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN;
  private readonly CEP_ORIGEM = (process.env.CEP_ORIGEM || "01001000").replace(
    /\D/g,
    "",
  );

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly cartRepository: CartRepository,
  ) {}

  public async calculateShipping(
    userId: string,
    zipCode: string,
    itemsFromRequest?: { productId: string; quantity: number }[],
  ): Promise<MelhorEnvioQuote[]> {
    if (!this.MELHOR_ENVIO_TOKEN) {
      throw new InternalServerError(
        "Configuração de logística ausente (Token).",
      );
    }

    const cleanZipCode = zipCode.replace(/\D/g, "");
    if (cleanZipCode.length < 8) {
      throw new BadRequestError("CEP inválido.");
    }

    const itemsForCalculation = await this.resolveItems(
      userId,
      itemsFromRequest,
    );

    if (itemsForCalculation.length === 0) {
      throw new BadRequestError("Carrinho vazio para cálculo.");
    }

    /**
     * 🔥 TESTE DE CHOQUE:
     * Se você estiver usando Token de PRODUÇÃO, mude "sandbox.melhorenvio"
     * para apenas "melhorenvio" na URL abaixo.
     */
    const targetUrl =
      "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate";

    const { data } = await axios.post<MelhorEnvioQuote[]>(
      targetUrl,
      {
        from: { postal_code: this.CEP_ORIGEM },
        to: { postal_code: cleanZipCode },
        products: itemsForCalculation,
      },
      {
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${this.MELHOR_ENVIO_TOKEN.trim()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "TavernaReserva/1.0 (contato@taverna.com)",
        },
      },
    );

    return Array.isArray(data)
      ? data.filter((ship) => !ship.error && ship.price)
      : [];
  }

  private async resolveItems(
    userId: string,
    itemsFromRequest?: { productId: string; quantity: number }[],
  ): Promise<MelhorEnvioProduct[]> {
    if (itemsFromRequest?.length) {
      const results = await Promise.all(
        itemsFromRequest.map(async (item) => {
          if (!Types.ObjectId.isValid(item.productId)) return null;
          const product = await this.productRepository.findById(item.productId);
          if (!product) return null;
          return this.mapToMelhorEnvio(product, item.quantity);
        }),
      );
      return results.filter((i): i is MelhorEnvioProduct => i !== null);
    }

    if (userId !== "guest") {
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart?.items?.length) return [];
      return cart.items.map((item) =>
        this.mapToMelhorEnvio(item.productId as any, item.quantity),
      );
    }

    return [];
  }

  private mapToMelhorEnvio(product: any, quantity: number): MelhorEnvioProduct {
    return {
      id: String(product._id || product.id),
      width: Number(product.dimensions?.width) || 15,
      height: Number(product.dimensions?.height) || 20,
      length: Number(product.dimensions?.length) || 15,
      weight: Number(product.weight) || 0.8,
      insurance_value: Number(product.priceCents || product.price) / 100 || 0,
      quantity,
    };
  }
}
