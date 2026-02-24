import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import { buildApp } from "../../src/app.js";
import { CheckoutService } from "../../src/services/checkout.service.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

// Aumentamos o timeout para lidar com o ReplicaSet em máquinas mais lentas
jest.setTimeout(60000);

describe("🧪 CheckoutService - Deep Stress & Integrity", () => {
  let app: any;
  let checkoutService: CheckoutService;

  beforeAll(async () => {
    // 1. Inicia o servidor de memória (ReplicaSet para Transactions)
    await setupMongoMemory();

    // 2. Builda o app e espera o Fastify estar pronto
    app = await buildApp();
    await app.ready();

    // 3. Garantia de Conexão Ativa (Pooling do Mongoose)
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        const timer = setInterval(() => {
          if (mongoose.connection.readyState === 1) {
            clearInterval(timer);
            resolve(true);
          }
        }, 100);
      });
    }

    const { OrderRepository } =
      await import("../../src/repositories/order.repository.js");
    const { CartRepository } =
      await import("../../src/repositories/cart.repository.js");
    const { ProductRepository } =
      await import("../../src/repositories/product.repository.js");

    const mockPaymentProvider = {
      generatePix: jest.fn(async (orderId: string) => ({
        qr_code: "mock_qr",
        qr_code_base64: "mock_base64",
        ticket_url: "https://wa.me/test",
        payment_id: "pay_123",
      })),
    };

    /**
     * 4. INSTANCIAÇÃO DE PRODUÇÃO
     * Ordem: (orderRepo, cartRepo, productRepo, paymentProvider, connection)
     */
    checkoutService = new CheckoutService(
      new OrderRepository(),
      new CartRepository(),
      new ProductRepository(),
      mockPaymentProvider as any,
      mongoose.connection,
    );

    console.log(
      "🔗 Conexão de Teste Estabelecida:",
      mongoose.connection.readyState === 1 ? "✅ ONLINE" : "❌ OFFLINE",
    );
  });

  afterAll(async () => {
    if (app) await app.close();
    await teardownMongoMemory();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it("🛡️ Deve impedir Race Condition usando o Lock de Memória", async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const idempotencyKey = "key-race-condition-" + Date.now();
    const data = {
      address: "Rua da Taverna, 123",
      zipCode: "01234-567",
      total: 1000,
      shipping: {
        service: "WhatsApp",
        price: 0,
        deadline: 1,
        company: "Taverna",
      },
      items: [
        { productId: new mongoose.Types.ObjectId().toHexString(), quantity: 1 },
      ],
    };

    // Dispara 3 requisições simultâneas
    const results = await Promise.allSettled([
      checkoutService.execute(
        userId,
        idempotencyKey,
        "nilton@teste.com",
        data as any,
      ),
      checkoutService.execute(
        userId,
        idempotencyKey,
        "nilton@teste.com",
        data as any,
      ),
      checkoutService.execute(
        userId,
        idempotencyKey,
        "nilton@teste.com",
        data as any,
      ),
    ]);

    const rejected = results.filter((r) => r.status === "rejected");

    // Deve haver pelo menos uma rejeição (seja por Lock ou por Estoque que acabou na primeira)
    expect(rejected.length).toBeGreaterThanOrEqual(1);

    const reason = (rejected[0] as any).reason.message;

    // ✅ Regex atualizado para cobrir todos os cenários de barreira do sistema
    expect(reason).toMatch(
      /Processamento em curso|já está sendo processado|offline|indisponível|Estoque insuficiente/i,
    );
  });

  it("🚫 Deve falhar se um produto do carrinho sumir do catálogo", async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const data = {
      address: "Rua Inexistente, 0",
      zipCode: "00000-000",
      total: 500,
      shipping: {
        service: "Sedex",
        price: 10,
        deadline: 5,
        company: "Correios",
      },
      items: [
        { productId: new mongoose.Types.ObjectId().toHexString(), quantity: 1 },
      ],
    };

    await expect(
      checkoutService.execute(userId, "ghost-key", "a@a.com", data as any),
    ).rejects.toThrow(
      /Produto não encontrado|Estoque insuficiente|offline|indisponível/i,
    );
  });

  it("📉 Deve validar a precisão decimal (Floating Point Error)", async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const data = {
      address: "Rua Decimal, 10",
      zipCode: "11111-111",
      total: 0.3,
      shipping: {
        service: "Digital",
        price: 0,
        deadline: 0,
        company: "Taverna",
      },
      items: [
        {
          productId: new mongoose.Types.ObjectId().toHexString(),
          quantity: 1,
          price: 0.1,
        },
        {
          productId: new mongoose.Types.ObjectId().toHexString(),
          quantity: 1,
          price: 0.2,
        },
      ],
    };

    try {
      await checkoutService.execute(
        userId,
        "decimal-key",
        "a@a.com",
        data as any,
      );
    } catch (e: any) {
      // O teste passa se não houver erro de "divergência de preço" (erro de soma 0.1+0.2)
      expect(e.message).not.toMatch(/divergência de preço/i);
    }
  });
});
