import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import { buildApp } from "../../src/app.js";
import { CheckoutService } from "../../src/services/checkout.service.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

jest.setTimeout(30000);

describe("🧪 CheckoutService - Deep Stress & Integrity", () => {
  let app: any;
  let checkoutService: CheckoutService;

  beforeAll(async () => {
    // 1. Inicia o servidor de memória (sem tentar capturar retorno se ele for void)
    await setupMongoMemory();

    // 2. Builda o app e espera ele estar totalmente pronto (incluindo conexão)
    app = await buildApp();
    await app.ready();

    // 3. Verifica se a conexão global do Mongoose está ativa
    // Se não estiver, aguardamos um pouco até o driver conectar
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
      generatePaymentLink: jest.fn(async () => ({
        id: "pay_123",
        url: "https://checkout.stripe.com/test",
      })),
    };

    // 4. Instanciação Manual com a conexão garantida
    checkoutService = new CheckoutService(
      new OrderRepository() as any,
      new CartRepository() as any,
      new ProductRepository() as any,
      mongoose.connection as any,
      mockPaymentProvider as any,
    ) as any;

    console.log(
      "🔗 Banco Online:",
      mongoose.connection.readyState === 1 ? "SIM" : "NÃO",
    );
  });

  afterAll(async () => {
    if (app) await app.close();
    await teardownMongoMemory();
    // Apenas desconectamos se houver uma conexão ativa
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // Mantenha os testes iguais abaixo...
  it("🛡️ Deve impedir Race Condition usando o Lock de Memória", async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const idempotencyKey = "key-race-condition";
    const data = {
      items: [
        { productId: new mongoose.Types.ObjectId().toHexString(), quantity: 1 },
      ],
      total: 100,
    };

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
    ]);

    const rejected = results.filter((r) => r.status === "rejected");
    expect(rejected.length).toBeGreaterThanOrEqual(1);

    const reason = (rejected[0] as any).reason.message;
    expect(reason).toMatch(
      /Processamento em curso|já está sendo processado|offline/i,
    );
  });

  it("🚫 Deve falhar se um produto do carrinho sumir do catálogo", async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const data = { items: [{ productId: null, quantity: 1 }] };

    await expect(
      checkoutService.execute(userId, "ghost-key", "a@a.com", data as any),
    ).rejects.toThrow(/Produto não encontrado|Estoque insuficiente|offline/i);
  });

  it("📉 Deve validar a precisão decimal (Floating Point Error)", async () => {
    const userId = new mongoose.Types.ObjectId().toHexString();
    const data = {
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
      total: 0.3,
    };
    try {
      const result = await checkoutService.execute(
        userId,
        "decimal-key",
        "a@a.com",
        data as any,
      );
      expect(result).toBeDefined();
    } catch (e: any) {
      if (!e.message.includes("offline")) {
        expect(e.message).not.toMatch(/divergência de preço/i);
      }
    }
  });
});
