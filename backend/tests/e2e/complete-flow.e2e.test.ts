process.env.NODE_ENV = "test";

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import crypto from "crypto";
import mongoose from "mongoose";
import { buildApp } from "../../src/app.js";
import { ProductModel } from "../../src/models/product.model.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("E2E: Fluxo Completo da Aplicação", () => {
  let app: any;
  let validToken: string;

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp();

    /**
     * 🛡️ SUPER BYPASS DE AUTENTICAÇÃO
     * Injetamos o usuário diretamente no ciclo do Fastify para evitar 401/403.
     */
    app.addHook("onRequest", async (request: any) => {
      request.jwtVerify = async () => {
        const mockUser = {
          id: new mongoose.Types.ObjectId().toString(),
          email: "tester@taverna.com",
          role: "admin",
        };
        request.user = mockUser;
        return mockUser;
      };
    });

    await app.ready();
    validToken = "token-bypass-final";

    // Fôlego para o ReplicaSet do MongoMemory estabilizar
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, 40000);

  afterAll(async () => {
    if (app) await app.close();
    await teardownMongoMemory();
  });

  it("🚀 Deve impedir pedidos duplicados via API (Concorrência Real)", async () => {
    // 1. Setup do Produto
    const product = await ProductModel.create({
      name: "Hidromel de Elite",
      price: 15000,
      stock: 10,
      category: "Vinho",
      active: true,
    });

    const idempotencyKey = crypto.randomUUID();

    // 💰 Valores para o Schema Zod
    const productPrice = 15000;
    const shippingPrice = 2000;
    const total = productPrice + shippingPrice;

    const payload = {
      address: "Rua das Vitórias, 777",
      zipCode: "12345-678",
      items: [{ productId: product._id.toString(), quantity: 1 }],
      shipping: { service: "SEDEX", price: shippingPrice, deadline: 1 },
      total: total,
    };

    // 2. Disparo triplo simultâneo para testar Race Condition
    const responses = await Promise.all([
      app.inject({
        method: "POST",
        url: "/api/v1/checkout/process",
        headers: {
          "idempotency-key": idempotencyKey,
          authorization: `Bearer ${validToken}`,
        },
        payload,
      }),
      app.inject({
        method: "POST",
        url: "/api/v1/checkout/process",
        headers: {
          "idempotency-key": idempotencyKey,
          authorization: `Bearer ${validToken}`,
        },
        payload,
      }),
      app.inject({
        method: "POST",
        url: "/api/v1/checkout/process",
        headers: {
          "idempotency-key": idempotencyKey,
          authorization: `Bearer ${validToken}`,
        },
        payload,
      }),
    ]);

    // 3. Validação de Status
    // O primeiro deve ser 201 obrigatoriamente
    expect(responses[0].statusCode).toBe(201);

    const statusCodes = responses.map((r) => r.statusCode);

    /**
     * 🛡️ LÓGICA DA VITÓRIA:
     * 201 = Sucesso original
     * 200 = Retorno de cache da idempotência
     * 409 = Bloqueio de concorrência ativa (Conflict)
     */
    expect(statusCodes.every((s) => [200, 201, 409].includes(s))).toBe(true);

    // 4. O TESTE DEFINITIVO: O estoque só pode ter caído 1 vez.
    const dbProduct = await ProductModel.findById(product._id);

    expect(dbProduct?.stock).toBe(9);

    console.log(`
      🍷 VITÓRIA NA TAVERNA!
      -----------------------
      Requisições simultâneas: 3
      Status observados: ${statusCodes.join(", ")}
      Estoque Final: ${dbProduct?.stock} (Esperado: 9)
      Idempotency Key: ${idempotencyKey}
    `);
  });
});
