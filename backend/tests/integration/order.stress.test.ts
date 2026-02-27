import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { buildApp } from "../../src/app.js";
import { CartModel } from "../../src/models/cart.model.js";
// ✅ Importando o seu helper robusto
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

mongoose.set("bufferCommands", false);

describe("🔥 Order - Teste de Stress e Concorrência Real", () => {
  let app: FastifyInstance;
  let testToken: string;
  const userId = "65c1fb000000000000000001";
  const TARGET_URL = "/api/v1/orders/checkout";

  beforeAll(async () => {
    console.log("🛠️ Iniciando setup do teste...");

    // 1. Inicia o MongoDB em Memória com ReplicaSet (necessário para transações)
    await setupMongoMemory();

    // 2. Constrói o app (que agora conectará automaticamente no URI do helper)
    app = await buildApp();
    await app.ready();

    testToken = app.jwt.sign({
      id: userId,
      email: "nilton@taverna.com",
      role: "admin",
    });

    console.log("✅ Setup concluído. MongoDB Conectado e Token Gerado.");
  }, 60000);

  afterAll(async () => {
    // Ordem inversa: fecha o app e depois o banco
    await app.close();
    await teardownMongoMemory();
    console.log("🛑 Conexões encerradas.");
  });

  it("🛡️ Deve garantir ATOMICIDADE: requisições simultâneas = apenas 1 pedido", async () => {
    const pId = new mongoose.Types.ObjectId("65c1fb000000000000000023");
    const uId = new mongoose.Types.ObjectId(userId);
    const PRECO_PRODUTO = 100;
    const VALOR_FRETE = 20;
    const TOTAL_ESPERADO = 120;

    // --- 📦 1. PREPARAR PRODUTO NO BANCO ---
    await mongoose.connection.collection("products").updateOne(
      { _id: pId },
      {
        $set: {
          name: "Cerveja de Haze",
          priceCents: PRECO_PRODUTO,
          price: PRECO_PRODUTO,
          stock: 100,
          active: true,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    // --- 🛒 2. LIMPAR E CRIAR CARRINHO FRESCO ---
    await mongoose.connection.collection("carts").deleteMany({
      $or: [{ userId: uId }, { userId: userId }],
    });

    await CartModel.create({
      userId: uId,
      items: [
        {
          productId: pId,
          quantity: 1,
          priceCents: PRECO_PRODUTO,
        },
      ],
      totalPriceCents: PRECO_PRODUTO,
      updatedAt: new Date(),
    });

    console.log("🛒 Carrinho preparado via Model.");

    const idempotencyKey = randomUUID();
    const payload = {
      items: [{ productId: "65c1fb000000000000000023", quantity: 1 }],
      total: TOTAL_ESPERADO,
      address: "Rua da Taverna, 123",
      zipCode: "12345678",
      shipping: {
        service: "Expresso",
        company: "TavernaLog",
        price: VALOR_FRETE,
        deadline: 2,
      },
    };

    const headers = {
      "idempotency-key": idempotencyKey,
      authorization: `Bearer ${testToken}`,
      "content-type": "application/json",
    };

    console.log(
      `🚀 Disparando rajada SIMULTÂNEA para a chave: ${idempotencyKey}`,
    );

    // --- ⚡ 3. DISPARO CONCORRENTE TOTAL ---
    const results = await Promise.all([
      app.inject({ method: "POST", url: TARGET_URL, headers, payload }),
      app.inject({ method: "POST", url: TARGET_URL, headers, payload }),
      app.inject({ method: "POST", url: TARGET_URL, headers, payload }),
      app.inject({ method: "POST", url: TARGET_URL, headers, payload }),
      app.inject({ method: "POST", url: TARGET_URL, headers, payload }),
    ]);

    const created = results.filter((r) => r.statusCode === 201).length;
    const conflicted = results.filter((r) => r.statusCode === 409).length;
    const others = results.filter((r) => ![201, 409].includes(r.statusCode));

    console.table({
      "Chave de Idempotência": idempotencyKey,
      "Sucesso (201)": created,
      "Conflito (409)": conflicted,
      "Erros Inesperados": others.length,
    });

    // Se houver erros inesperados (como o 500 do Zod), vamos logar o primeiro para debug
    if (others.length > 0) {
      console.error("Primeiro erro inesperado:", others[0].payload);
    }

    // ✅ VALIDAÇÕES DE ATOMICIDADE
    expect(created).toBe(1);
    expect(conflicted).toBe(4);
    expect(others.length).toBe(0);

    // --- 🧹 4. VALIDAÇÃO DE LIMPEZA DO CARRINHO ---
    console.log("🧹 Verificando limpeza do carrinho no banco...");

    let isClean = false;
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 400));

      const cartAfter = await mongoose.connection.collection("carts").findOne({
        $or: [{ userId: uId }, { userId: userId }],
      });

      isClean = !cartAfter || !cartAfter.items || cartAfter.items.length === 0;
      if (isClean) break;
    }

    expect(isClean).toBe(true);
  }, 40000);
});
