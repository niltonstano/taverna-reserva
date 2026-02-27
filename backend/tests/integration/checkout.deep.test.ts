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
import { CheckoutService } from "../../src/services/checkout.service.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

jest.setTimeout(90000);

describe("🌊 Checkout E2E - Stress & Integrity", () => {
  let appInstance: any;
  const CHECKOUT_URL = "/api/v1/checkout/process";
  const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  beforeAll(async () => {
    await setupMongoMemory();
    appInstance = await buildApp();
    await appInstance.ready();
  });

  afterAll(async () => {
    if (appInstance) await appInstance.close();
    await mongoose.disconnect();
    await teardownMongoMemory();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URL!);
    }

    await Promise.all([
      ProductModel.deleteMany({}),
      CartModel.deleteMany({}),
      OrderModel.deleteMany({}),
    ]);

    jest.restoreAllMocks();

    /**
     * 🛡️ Mock Cirúrgico do buildResponse
     * Ele emula a resposta do WhatsAppService E a estrutura do Controller
     * para evitar erros de serialização (FST_ERR_RESPONSE_SERIALIZATION).
     */
    jest
      .spyOn(CheckoutService.prototype as any, "buildResponse")
      .mockImplementation(async (order: any) => {
        const orderId =
          order?._id?.toString() || new Types.ObjectId().toHexString();
        const waLink = `https://wa.me/5511999999999?text=Pedido-${orderId}`;

        return {
          // Se o seu controller retornar { success: true, ...result }, garanta que os campos batam.
          success: true,
          message: "Checkout processado com sucesso",
          order: {
            _id: orderId,
            userId:
              order?.userId?.toString() || new Types.ObjectId().toHexString(),
            customerEmail: order?.customerEmail || "cliente@teste.com",
            totalPriceCents: Number(order?.totalPriceCents) || 0,
            status: order?.status || "pending",
            items: order?.items || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          payment_data: {
            qr_code: "WHATSAPP_LINK",
            qr_code_base64: "",
            ticket_url: waLink,
            payment_id: `WA-MOCK-${Date.now()}`,
            payment_url: waLink,
          },
        };
      });
  });

  const generateTestToken = (userId: string, email: string) => {
    return jwt.sign({ id: userId, email, role: "customer" }, JWT_SECRET);
  };

  it("🚀 Stress Test: Idempotência em Requisições Concorrentes", async () => {
    const userId = new Types.ObjectId().toHexString();
    const token = generateTestToken(userId, "concurrent@test.com");
    const iKey = randomUUID();

    const product = await ProductModel.create({
      name: "Vinho Stress",
      price: 50.0,
      stock: 100,
      active: true,
      category: "Vinho",
      weight: 1.0,
      dimensions: { width: 1, height: 1, length: 1 },
    });

    const payload = {
      address: "Rua Stress, 100",
      zipCode: "12345678",
      total: 60.0,
      shipping: {
        price: 10.0,
        service: "FIXO",
        deadline: 5,
        company: "Taverna Log",
      },
      items: [{ productId: product._id.toString(), quantity: 1 }],
    };

    // 🏎️ Dispara 5 requisições ao mesmo tempo com a mesma Idempotency-Key
    const requests = Array(5)
      .fill(null)
      .map(() =>
        request(appInstance.server)
          .post(CHECKOUT_URL)
          .set({ Authorization: `Bearer ${token}`, "idempotency-key": iKey })
          .send(payload),
      );

    const responses = await Promise.all(requests);

    // Filtra sucessos: Consideramos 200 ou 201 como sucesso de idempotência
    const successResponses = responses.filter(
      (r) => r.status === 201 || r.status === 200,
    );
    const conflictResponses = responses.filter((r) => r.status === 409);

    console.log(
      `📊 Resultado Final: ${successResponses.length} Sucesso, ${conflictResponses.length} Conflitos`,
    );

    const finalProduct = await ProductModel.findById(product._id);
    const finalOrders = await OrderModel.countDocuments({ userId });

    // Verificações:
    // 1. O estoque deve ter reduzido apenas 1 vez.
    expect(finalProduct?.stock).toBe(99);
    // 2. Apenas um pedido deve existir no banco para este usuário/chave.
    expect(finalOrders).toBe(1);
    // 3. O teste deve acusar exatamente 1 sucesso na primeira requisição.
    expect(successResponses.length).toBe(1);
  });

  it("⚛️ Deve garantir Atomicidade (Rollback) se a criação do pedido falhar", async () => {
    const userId = new Types.ObjectId().toHexString();
    const token = generateTestToken(userId, "rollback@test.com");

    const product = await ProductModel.create({
      name: "Vinho Teste",
      price: 100.0,
      stock: 10,
      active: true,
      category: "Vinho",
      weight: 1.5,
      dimensions: { width: 10, height: 33, length: 10 },
    });

    // Simula falha catastrófica no repositório de ordens
    const orderRepoSpy = jest
      .spyOn(OrderRepository.prototype, "create")
      .mockRejectedValueOnce(new Error("DATABASE_CRASH_SIMULATION"));

    const payload = {
      address: "Rua do Erro, 0",
      zipCode: "00000000",
      total: 510.0,
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
      })
      .send(payload);

    // Status 500 devido ao erro simulado
    expect(response.status).toBe(500);

    // O estoque DEVE ter voltado para 10 devido ao Rollback da Transação
    const productAfterFail = await ProductModel.findById(product._id);
    expect(productAfterFail?.stock).toBe(10);

    orderRepoSpy.mockRestore();
  });
});
