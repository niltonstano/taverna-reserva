import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ProductRepository } from "../../src/repositories/product.repository.js";
import { ProductModel } from "../../src/models/product.model.js";

describe("ProductRepository", () => {
  let mongoServer: MongoMemoryServer;
  let repository: ProductRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    repository = new ProductRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await ProductModel.deleteMany({});
  });

  it("deve criar um produto com todos os campos obrigatórios", async () => {
    const productData = {
      name: "Mouse Gamer",
      description: "Mouse óptico de alta performance",
      price: 150,
      stock: 10,
      category: "periféricos", 
      active: true
    };

    // repository.create agora deve retornar o tipo correto se 
    // você seguiu o padrão do OrderRepository
    const product = await repository.create(productData);
    
    expect(product.name).toBe("Mouse Gamer");
    expect(product.category).toBe("periféricos");
    expect(product.active).toBe(true);
  });
});