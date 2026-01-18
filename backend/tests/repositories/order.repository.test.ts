import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { Types } from "mongoose";
import { OrderRepository } from "../../src/repositories/order.repository.js";
import { OrderModel } from "../../src/models/order.model.js";
import { 
  setupMongoMemory as connect, 
  teardownMongoMemory as disconnect, 
  clearDatabase as clear 
} from "../helpers/mongo-memory.js";

describe("OrderRepository", () => {
  let repository: OrderRepository;

  beforeAll(async () => await connect());
  afterEach(async () => await clear());
  afterAll(async () => await disconnect());

  beforeEach(() => {
    repository = new OrderRepository();
  });

  // Função auxiliar para gerar dados válidos conforme seu Schema
  const getValidOrderData = (overrides = {}) => ({
    userId: new Types.ObjectId(),
    idempotencyKey: `key-${Math.random()}`, // Obrigatório
    totalPrice: 100,                        // Alinhado com o erro do log
    status: "pending",
    shippingAddress: "Rua Teste, 123",
    paymentMethod: "credit_card",
    items: [{ 
      productId: new Types.ObjectId(), 
      name: "Produto Teste",                // Obrigatório
      quantity: 2, 
      price: 50,
      subtotal: 100                         // Obrigatório
    }],
    ...overrides
  });

  it("deve criar um novo pedido com sucesso", async () => {
    const orderData = getValidOrderData();
    const order = await repository.create(orderData as any);

    expect(order).toBeDefined();
    expect((order as any).totalPrice).toBe(100);
  });

  it("deve buscar pedidos de um usuário específico via findByUserId", async () => {
    const data = getValidOrderData({ status: "pending" }); // Mudei de completed para pending para evitar erro de enum
    await OrderModel.create(data);

    const orders = await repository.findByUserId(data.userId.toHexString());

    expect(orders).toHaveLength(1);
    expect((orders[0] as any).totalPrice).toBe(100);
  });

  it("deve buscar um pedido por Idempotency Key", async () => {
    const data = getValidOrderData({ idempotencyKey: "unique-123" });
    await OrderModel.create(data);

    const order = await repository.findByIdempotencyKey(data.userId.toHexString(), "unique-123");

    expect(order).not.toBeNull();
    expect((order as any)?.idempotencyKey).toBe("unique-123");
  });

  it("deve atualizar o status de um pedido", async () => {
    const data = getValidOrderData();
    const order = await OrderModel.create(data);

    // Certifique-se que "shipped" é um valor aceito no seu ENUM do model
    const updatedOrder = await repository.updateStatus(order._id.toString(), "shipped");

    expect((updatedOrder as any)?.status).toBe("shipped");
  });
});