import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { ProductModel } from "../../src/models/product.model.js";
import { ProductRepository } from "../../src/repositories/product.repository.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("🛡️ ProductRepository - Concorrência de Estoque", () => {
  const repo = new ProductRepository();

  beforeAll(async () => await setupMongoMemory());
  afterAll(async () => await teardownMongoMemory());

  it("Deve garantir que o estoque nunca fique negativo em rajadas simultâneas", async () => {
    const produto = await ProductModel.create({
      name: "Cerveja Amanteigada Rara",
      price: 50,
      stock: 5,
      active: true,
      category: "Vinho", // ✅ CORRIGIDO: Categoria válida
    });

    const productId = produto._id.toString();
    const totalTentativas = 15;

    const promessas = Array.from({ length: totalTentativas }).map(() =>
      repo.updateStock(productId, 1),
    );

    const resultados = await Promise.all(promessas);

    const sucessos = resultados.filter((r) => r !== null).length;
    const produtoFinal = await ProductModel.findById(productId);

    expect(sucessos).toBe(5);
    expect(produtoFinal?.stock).toBe(0);
  }, 20000);
});
