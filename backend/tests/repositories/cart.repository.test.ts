import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import { Types } from "mongoose";
import { ProductModel } from "../../src/models/product.model.js";
import { CartRepository } from "../../src/repositories/cart.repository.js";
import {
  clearMockDB,
  connectMockDB,
  disconnectMockDB,
} from "../helpers/mongo-memory.js";

describe("CartRepository - Integração", () => {
  let cartRepository: CartRepository;

  beforeAll(async () => await connectMockDB());
  afterAll(async () => await disconnectMockDB());

  beforeEach(async () => {
    await clearMockDB();
    cartRepository = new CartRepository();
  });

  const userId = new Types.ObjectId().toHexString();

  const createFakeProduct = async (name = "Produto Teste") => {
    return await ProductModel.create({
      name,
      price: 10000,
      stock: 50,
      active: true,
      category: "Vinho", // ✅ Categoria válida
      weight: 1.5,
      dimensions: { width: 10, height: 30, length: 10 },
    });
  };

  describe("addItemAtomic", () => {
    it("deve criar um novo carrinho (upsert) se o usuário não possuir um", async () => {
      const product = await createFakeProduct();
      await cartRepository.addItemAtomic(userId, product._id.toString(), 2);

      const cart = await cartRepository.findByUserId(userId);
      expect(cart?.items).toHaveLength(1);
      expect(cart?.items[0].quantity).toBe(2);
    });

    it("deve incrementar a quantidade se o produto já existir", async () => {
      const product = await createFakeProduct();
      const pId = product._id.toString();

      await cartRepository.addItemAtomic(userId, pId, 1);
      await cartRepository.addItemAtomic(userId, pId, 2);

      const cart = await cartRepository.findByUserId(userId);
      expect(cart?.items[0].quantity).toBe(3);
    });
  });

  describe("clearCart", () => {
    it("deve limpar os itens do carrinho", async () => {
      const product = await createFakeProduct();
      await cartRepository.addItemAtomic(userId, product._id.toString(), 5);

      const success = await cartRepository.clearCart(userId);
      const cart = await cartRepository.findByUserId(userId);

      expect(success).toBe(true);
      expect(cart?.items).toHaveLength(0);
    });
  });
});
