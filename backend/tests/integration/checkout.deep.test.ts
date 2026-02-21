/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { buildApp } from "../../src/app.js";
import { CartModel } from "../../src/models/cart.model.js";
import { OrderModel } from "../../src/models/order.model.js";
import { ProductModel } from "../../src/models/product.model.js";
import { OrderRepository } from "../../src/repositories/order.repository.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

// Aumentado para lidar com o ReplicaSet do MongoDB Memory Server
jest.setTimeout(60000);

describe("🌊 Checkout Deep Integration - End-to-End Stress", () => {
  let appInstance: any;
  const CHECKOUT_URL = "/api/v1/checkout/process";
  const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  beforeAll(async () => {
    // 1. Inicia o servidor de memória.
    // O helper setupMongoMemory geralmente já faz o mongoose.connect() internamente.
    await setupMongoMemory();

    // 2. Garante que a URI de teste seja passada para o Plugin de Database do Fastify.
    // Se o helper já conectou, extraímos a URI da conexão ativa para evitar o erro de tipagem.
    process.env.MONGODB_URI = mongoose.connection.host
      ? `mongodb://${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`
      : "mongodb://127.0.0.1:27017/test";

    // 3. Inicializa o servidor Fastify
    appInstance = await buildApp();
    await appInstance.ready();
  });

  afterAll(async () => {
    // Ordem de fechamento: App -> Mongoose -> Servidor de Memória
    if (appInstance) await appInstance.close();
    await mongoose.disconnect();
    await teardownMongoMemory();
  });

  beforeEach(async () => {
    // Limpeza dos estados entre cada teste (it)
    if (mongoose.connection.readyState !== 0) {
      await ProductModel.deleteMany({});
      await CartModel.deleteMany({});
      await OrderModel.deleteMany({});
      await OrderModel.syncIndexes().catch(() => {});
    }
  });

  const generateTestToken = (userId: string, email: string) => {
    return jwt.sign({ id: userId, email }, JWT_SECRET);
  };

  it("⚛️ Deve garantir Atomicidade (Rollback) se a criação do pedido falhar", async () => {
    const userId = new Types.ObjectId().toHexString();
    const token = generateTestToken(userId, "rollback@test.com");

    const product = await ProductModel.create({
      name: "Vinho Seguro",
      price: 100,
      stock: 10,
      active: true,
      category: "Vinho",
      weight: 1.5,
      dimensions: { width: 10, height: 33, length: 10 },
    });

    await CartModel.create({
      userId: new Types.ObjectId(userId),
      items: [{ productId: product._id, quantity: 5 }],
    });

    // Simula uma falha no banco de dados para testar o rollback de estoque
    const spy = jest
      .spyOn(OrderRepository.prototype, "create")
      .mockRejectedValueOnce(new Error("FALHA_SIMULADA_NO_REPOSITORIO"));

    const payload = {
      address: "Rua Rollback, 123",
      zipCode: "12345678",
      total: 510,
      shipping: {
        price: 10.0,
        service: "SEDEX",
        deadline: 1,
        company: "Correios",
      },
      items: [{ productId: product._id.toString(), quantity: 5 }],
    };

    const response = await request(appInstance.server)
      .post(CHECKOUT_URL)
      .set({
        Authorization: `Bearer ${token}`,
        "idempotency-key": randomUUID(),
        "Content-Type": "application/json",
      })
      .send(payload);

    expect(response.status).toBeGreaterThanOrEqual(400);

    // Verificação do Rollback: O estoque deve continuar 10
    const finalProduct = await ProductModel.findById(product._id);
    expect(finalProduct?.stock).toBe(10);

    spy.mockRestore();
  });

  it("🛡️ Deve lidar com múltiplas requisições simultâneas (Stress)", async () => {
    const userId = new Types.ObjectId().toHexString();
    const token = generateTestToken(userId, "stress@test.com");
    const idempotencyKey = randomUUID();

    const product = await ProductModel.create({
      name: "Vinho Estresse",
      price: 200,
      stock: 100,
      active: true,
      category: "Vinho",
      weight: 1.5,
      dimensions: { width: 10, height: 33, length: 10 },
    });

    await CartModel.create({
      userId: new Types.ObjectId(userId),
      items: [{ productId: product._id, quantity: 1 }],
    });

    const payload = {
      address: "Rua Stress, 999",
      zipCode: "88888888",
      total: 215,
      shipping: {
        price: 15.0,
        service: "SEDEX",
        deadline: 3,
        company: "Taverna",
      },
      items: [{ productId: product._id.toString(), quantity: 1 }],
    };

    // Execução paralela: testa a Idempotência e concorrência de estoque
    const requests = [1, 2, 3, 4, 5].map(() =>
      request(appInstance.server)
        .post(CHECKOUT_URL)
        .set({
          Authorization: `Bearer ${token}`,
          "idempotency-key": idempotencyKey,
          "Content-Type": "application/json",
        })
        .send(payload),
    );

    const responses = await Promise.all(requests);

    const successes = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);

    // Deve permitir apenas 1 criação e barrar o resto por idempotência (409)
    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(4);

    const ordersInDb = await OrderModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });
    expect(ordersInDb).toBe(1);
  });
});
