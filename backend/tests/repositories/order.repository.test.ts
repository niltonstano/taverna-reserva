import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import { Connection, Types } from "mongoose";
import { OrderModel } from "../../src/models/order.model.js";
import { OrderRepository } from "../../src/repositories/order.repository.js";
import { OrderCreateInput } from "../../src/types/order.type.js";
import {
  getMongooseConnection,
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("OrderRepository - Integração com Transações", () => {
  let orderRepository: OrderRepository;
  let connection: Connection;

  beforeAll(async () => {
    await setupMongoMemory();
    connection = getMongooseConnection();
    orderRepository = new OrderRepository();
  });

  afterAll(async () => {
    await teardownMongoMemory();
  });

  beforeEach(async () => {
    await OrderModel.deleteMany({});
    await OrderModel.syncIndexes();
  });

  const mockOrderData = (
    userId: Types.ObjectId,
    key: string,
  ): OrderCreateInput => ({
    userId,
    customerEmail: "cliente@taverna.com",
    idempotencyKey: key,
    items: [
      {
        productId: new Types.ObjectId(),
        name: "Vinho",
        quantity: 1,
        priceCents: 1000,
        subtotalCents: 1000,
      },
    ],
    totalPriceCents: 1000,
    shippingPriceCents: 0,
    status: "pending",
    address: "Rua Teste",
    zipCode: "00000-000",
    shipping: { service: "S", company: "C", priceCents: 0, deadline: 1 },
  });

  it("🛡️ Deve garantir idempotência: chamadas duplicadas retornam o mesmo registro", async () => {
    const userId = new Types.ObjectId();
    const key = "chave-idempotencia-" + Date.now();
    const orderData = mockOrderData(userId, key);

    // 1. Criamos o primeiro pedido
    const firstCall = await orderRepository.create(orderData);
    expect(firstCall.id).toBeDefined();

    // 2. Segunda tentativa com os mesmos dados (Idempotência)
    // O Repositório agora captura o erro 11000 e retorna o pedido existente
    const secondCall = await orderRepository.create(orderData);

    // ✅ VALIDAÇÕES
    // Os IDs devem ser idênticos
    expect(secondCall.id).toBe(firstCall.id);

    // O banco de dados não deve ter criado um novo documento
    const totalNoBanco = await OrderModel.countDocuments({
      userId,
      idempotencyKey: key,
    });
    expect(totalNoBanco).toBe(1);
  });

  it("✅ Deve permitir pedidos com a mesma chave para usuários diferentes", async () => {
    const key = "mesma-chave";
    const user1 = new Types.ObjectId();
    const user2 = new Types.ObjectId();

    const order1 = await orderRepository.create(mockOrderData(user1, key));
    const order2 = await orderRepository.create(mockOrderData(user2, key));

    expect(order1.id).not.toBe(order2.id);
    expect(order1.userId).not.toBe(order2.userId);

    const count = await OrderModel.countDocuments({ idempotencyKey: key });
    expect(count).toBe(2);
  });
});
