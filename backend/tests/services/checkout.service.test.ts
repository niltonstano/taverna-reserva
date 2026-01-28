import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import { Connection, Types } from "mongoose";
import { CartModel } from "../../src/models/cart.model.js";
import { OrderModel } from "../../src/models/order.model.js";
import { ProductModel } from "../../src/models/product.model.js";
import { CartRepository } from "../../src/repositories/cart.repository.js";
import { OrderRepository } from "../../src/repositories/order.repository.js";
import { ProductRepository } from "../../src/repositories/product.repository.js";
import { CheckoutService } from "../../src/services/checkout.service.js";
import {
  getMongooseConnection,
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("🧪 CheckoutService Integration", () => {
  let connection: Connection;
  let checkoutService: CheckoutService;
  let userId: string;

  beforeAll(async () => {
    await setupMongoMemory();
    connection = getMongooseConnection();

    checkoutService = new CheckoutService(
      new OrderRepository(),
      new CartRepository(),
      new ProductRepository(),
      connection,
    );
  });

  afterAll(async () => {
    await teardownMongoMemory();
  });

  beforeEach(async () => {
    userId = new Types.ObjectId().toHexString();
    await ProductModel.deleteMany({});
    await CartModel.deleteMany({});
    await OrderModel.deleteMany({});
  });

  it("✅ Deve finalizar o checkout com sucesso (Fluxo Completo)", async () => {
    const product = await ProductModel.create({
      name: "Teclado Mecânico",
      price: 500,
      stock: 10,
      active: true,
      category: "informatica",
    });

    await CartModel.create({
      userId: new Types.ObjectId(userId),
      items: [{ productId: product._id, quantity: 2 }],
    });

    const result = await checkoutService.execute(
      userId,
      "checkout-test-123",
      "user@test.com",
    );

    const order = result.order;

    expect(order).toBeDefined();
    expect(order.items).toHaveLength(1);
    expect(order.totalPrice).toBe(1000);
    expect(result.payment_data).toHaveProperty("qr_code");
    expect(result.payment_data.ticket_url).toContain(order._id.toString());

    // 🧹 Carrinho deve ser limpo
    const cartAfter = await CartModel.findOne({ userId });
    expect(cartAfter?.items).toHaveLength(0);

    // 📦 Estoque deve baixar
    const updatedProduct = await ProductModel.findById(product._id);
    expect(updatedProduct?.stock).toBe(8);
  });

  it("🛡️ Deve ativar idempotência se chamado duas vezes com a mesma chave", async () => {
    const product = await ProductModel.create({
      name: "Mouse Gamer",
      price: 100,
      stock: 5,
      active: true,
      category: "informatica",
    });

    await CartModel.create({
      userId: new Types.ObjectId(userId),
      items: [{ productId: product._id, quantity: 1 }],
    });

    const key = "same-key";

    const result1 = await checkoutService.execute(userId, key, "user@test.com");
    const result2 = await checkoutService.execute(userId, key, "user@test.com");

    expect(result1.order._id.toString()).toBe(result2.order._id.toString());

    // 📦 Estoque só pode diminuir UMA vez
    const updatedProduct = await ProductModel.findById(product._id);
    expect(updatedProduct?.stock).toBe(4);

    // 📄 Só pode existir UM pedido
    const orders = await OrderModel.find({});
    expect(orders).toHaveLength(1);
  });

  it("❌ Deve falhar se o carrinho estiver vazio", async () => {
    await CartModel.create({
      userId: new Types.ObjectId(userId),
      items: [],
    });

    await expect(
      checkoutService.execute(userId, "empty-cart", "user@test.com"),
    ).rejects.toThrow("Carrinho vazio.");
  });

  it("❌ Deve falhar se não houver estoque suficiente", async () => {
    const product = await ProductModel.create({
      name: "Monitor",
      price: 1200,
      stock: 1,
      active: true,
      category: "informatica",
    });

    await CartModel.create({
      userId: new Types.ObjectId(userId),
      items: [{ productId: product._id, quantity: 2 }],
    });

    await expect(
      checkoutService.execute(userId, "no-stock", "user@test.com"),
    ).rejects.toThrow("Estoque insuficiente");

    // Estoque não pode ser alterado
    const unchanged = await ProductModel.findById(product._id);
    expect(unchanged?.stock).toBe(1);
  });
});
