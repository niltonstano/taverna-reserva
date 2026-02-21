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
import { Connection, Types } from "mongoose";
import { OrderModel } from "../../src/models/order.model.js";
import { ProductModel } from "../../src/models/product.model.js";
import { OrderRepository } from "../../src/repositories/order.repository.js";
import { ProductRepository } from "../../src/repositories/product.repository.js";
import { OrderService } from "../../src/services/order.service.js";
import {
  getMongooseConnection,
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("OrderService - Integração e Profundidade", () => {
  let orderService: OrderService;
  let connection: Connection;

  // Criamos um ID válido para usar em todos os testes
  const validUserId = new Types.ObjectId().toString();

  beforeAll(async () => {
    await setupMongoMemory();
    connection = getMongooseConnection();
    orderService = new OrderService(
      new OrderRepository(),
      new ProductRepository(),
      connection,
    );
    await OrderModel.ensureIndexes();
    await ProductModel.ensureIndexes();
  });

  afterAll(async () => {
    await teardownMongoMemory();
  });

  beforeEach(async () => {
    await OrderModel.deleteMany({});
    await ProductModel.deleteMany({});
    jest.restoreAllMocks();
  });

  it("🛡️ Deve garantir que pedidos duplicados retornem o mesmo registro (Idempotência)", async () => {
    const idempotencyKey = `idemp-${Date.now()}`;
    const product = await ProductModel.create({
      name: "Cerveja",
      price: 25.5,
      stock: 10,
    });
    const payload = {
      address: "Rua do Código, 404",
      zipCode: "12345-678",
      items: [{ productId: product._id.toString(), quantity: 2 }],
      shipping: { service: "SEDEX", price: 15.0, deadline: 3 },
    };

    const firstOrder = await orderService.createOrder(
      validUserId,
      "n@t.com",
      idempotencyKey,
      payload as any,
    );
    const secondOrder = await orderService.createOrder(
      validUserId,
      "n@t.com",
      idempotencyKey,
      payload as any,
    );

    expect(secondOrder.id || (secondOrder as any)._id.toString()).toBe(
      firstOrder.id || (firstOrder as any)._id.toString(),
    );
  });

  it("❌ Deve fazer Rollback total se um item falhar por estoque insuficiente", async () => {
    const product = await ProductModel.create({
      name: "Raro",
      price: 10,
      stock: 1,
    });
    const payload = {
      address: "Rua",
      zipCode: "000",
      items: [{ productId: product._id.toString(), quantity: 10 }],
      shipping: { service: "L", price: 10, deadline: 1 },
    };

    await expect(
      orderService.createOrder(
        validUserId,
        "e@t.com",
        "k-fail",
        payload as any,
      ),
    ).rejects.toThrow(/Estoque insuficiente/);

    const productAfter = await ProductModel.findById(product._id);
    expect(productAfter?.stock).toBe(1);
  });

  it("⚔️ Deve lidar com concorrência: 5 tentativas simultâneas para apenas 1 item no estoque", async () => {
    const product = await ProductModel.create({
      name: "Única",
      price: 50,
      stock: 1,
    });
    const payload = {
      address: "Arena",
      zipCode: "000",
      items: [{ productId: product._id.toString(), quantity: 1 }],
      shipping: { service: "E", price: 10, deadline: 1 },
    };

    const results = await Promise.allSettled([
      orderService.createOrder(
        new Types.ObjectId().toString(),
        "u1@t.com",
        "k1",
        payload as any,
      ),
      orderService.createOrder(
        new Types.ObjectId().toString(),
        "u2@t.com",
        "k2",
        payload as any,
      ),
      orderService.createOrder(
        new Types.ObjectId().toString(),
        "u3@t.com",
        "k3",
        payload as any,
      ),
      orderService.createOrder(
        new Types.ObjectId().toString(),
        "u4@t.com",
        "k4",
        payload as any,
      ),
      orderService.createOrder(
        new Types.ObjectId().toString(),
        "u5@t.com",
        "k5",
        payload as any,
      ),
    ]);

    expect(results.filter((r) => r.status === "fulfilled").length).toBe(1);
    const finalProduct = await ProductModel.findById(product._id);
    expect(finalProduct?.stock).toBe(0);
  });

  it("💥 Deve garantir integridade se o banco falhar (Rollback de Erro Interno)", async () => {
    const product = await ProductModel.create({
      name: "Safe",
      price: 10,
      stock: 5,
    });

    // Forçamos o erro no repositório
    jest
      .spyOn((orderService as any).orderRepository, "create")
      .mockRejectedValueOnce(new Error("DB Crash"));

    const payload = {
      address: "Rua",
      zipCode: "000",
      items: [{ productId: product._id.toString(), quantity: 2 }],
      shipping: { service: "S", price: 10, deadline: 1 },
    };

    // Usando validUserId em vez de "u1"
    await expect(
      orderService.createOrder(
        validUserId,
        "a@t.com",
        "key-crash",
        payload as any,
      ),
    ).rejects.toThrow("DB Crash");

    const productCheck = await ProductModel.findById(product._id);
    expect(productCheck?.stock).toBe(5); // Rollback funcionou!
  });

  it("💰 Deve ignorar preços enviados pelo frontend (Anti-Tampering)", async () => {
    const product = await ProductModel.create({
      name: "Caro",
      price: 100.0,
      stock: 10,
    });
    const payload = {
      address: "Rua",
      zipCode: "000",
      items: [{ productId: product._id.toString(), quantity: 1, price: 1.0 }],
      shipping: { service: "S", price: 10.0, deadline: 1 },
    };

    const order = await orderService.createOrder(
      validUserId,
      "h@t.com",
      "hack",
      payload as any,
    );
    expect(order.totalPriceCents).toBe(11000);
  });

  it("📦 Deve processar um pedido com múltiplos itens", async () => {
    const products = await Promise.all(
      Array.from({ length: 5 }).map((_, i) =>
        ProductModel.create({ name: `P${i}`, price: 10, stock: 5 }),
      ),
    );
    const payload = {
      address: "Rua",
      zipCode: "000",
      items: products.map((p) => ({
        productId: p._id.toString(),
        quantity: 1,
      })),
      shipping: { service: "S", price: 20, deadline: 5 },
    };

    const order = await orderService.createOrder(
      validUserId,
      "b@t.com",
      "bulk",
      payload as any,
    );
    expect(order.items.length).toBe(5);
    expect(order.totalPriceCents).toBe(7000);
  });

  it("🚫 Não deve permitir cancelamento duplo de pedido", async () => {
    const product = await ProductModel.create({
      name: "Stock",
      price: 10,
      stock: 5,
    });
    const order = await OrderModel.create({
      userId: new Types.ObjectId(),
      customerEmail: "n@t.com",
      address: "Rua",
      zipCode: "000",
      idempotencyKey: "lock-test",
      items: [
        {
          productId: product._id,
          quantity: 2,
          priceCents: 1000,
          name: "T",
          subtotalCents: 2000,
        },
      ],
      shipping: { service: "S", company: "T", priceCents: 1000, deadline: 1 },
      status: "pending",
      totalPriceCents: 3000,
    });

    await orderService.updateOrderStatus(order._id.toString(), "cancelled");

    // ✅ SINCRONIZADO: O teste agora espera exatamente o que o seu BadRequestError joga
    await expect(
      orderService.updateOrderStatus(order._id.toString(), "cancelled"),
    ).rejects.toThrow("Pedidos encerrados não podem ser alterados.");

    const prodAfter = await ProductModel.findById(product._id);
    expect(prodAfter?.stock).toBe(7);
  });
});
