import { describe, it, expect, beforeAll, afterAll, jest, beforeEach } from "@jest/globals";
import { buildApp } from "../../src/app.js";
import { setupMongoMemory, teardownMongoMemory } from "../helpers/mongo-memory.js";
import { CustomerModel } from "../../src/models/customer.model.js"; 
import mongoose from "mongoose";

describe("📦 Integração: Pedidos e Checkout (Fluxo de Transação)", () => {
  jest.setTimeout(60000);
  let app: any;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let productId: string = ""; 

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp();
    await app.ready();

    const testEmail = `cliente-${Date.now()}@teste.com`;
    const userDoc = await CustomerModel.create({
      name: "Cliente Teste",
      email: testEmail,
      password: "hashed_password_123"
    });

    userId = userDoc._id.toString();
    adminToken = app.jwt.sign({ id: new mongoose.Types.ObjectId().toHexString(), role: 'admin' });
    userToken = app.jwt.sign({ id: userId, email: testEmail, role: 'customer' });
  });

  beforeEach(async () => {
    // 1. Criar produto novo
    const productRes = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      headers: { "authorization": `Bearer ${adminToken}` },
      payload: { 
        name: "Produto Teste Luxo", 
        price: 150.00, 
        stock: 100, 
        category: "eletronicos",
        description: "Descricao longa para validar o Zod corretamente" 
      }
    });
    
    const resJson = productRes.json();
    const rawId = resJson.data?._id || resJson._id;
    // Força o ID a ser uma string limpa de 24 caracteres
    productId = new mongoose.Types.ObjectId(rawId).toHexString();

    // 2. Limpar carrinho antes de cada teste para evitar lixo [object Object]
    await app.inject({
      method: "DELETE",
      url: "/api/v1/cart",
      headers: { "authorization": `Bearer ${userToken}` }
    });
  });

  afterAll(async () => {
    await app.close();
    await teardownMongoMemory();
  });

  it("✅ deve realizar o fluxo completo: Carrinho -> Checkout", async () => {
    // PASSO 1: Adicionar ao carrinho
    const cartRes = await app.inject({
      method: "POST",
      url: "/api/v1/cart/items",
      headers: { "authorization": `Bearer ${userToken}` },
      payload: { 
        productId: productId, 
        quantity: 1 
      }
    });
    
    expect(cartRes.statusCode).toBe(201);

    // PASSO 2: Checkout
    const checkoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders/checkout", 
      headers: { 
        "authorization": `Bearer ${userToken}`,
        "idempotency-key": `key-${Date.now()}`
      }
    });

    if (checkoutRes.statusCode !== 201 && checkoutRes.statusCode !== 200) {
        console.error("❌ Falha no Checkout. Resposta:", JSON.stringify(checkoutRes.json(), null, 2));
    }

    expect([200, 201]).toContain(checkoutRes.statusCode);
    expect(checkoutRes.json().success).toBe(true);
  });
});