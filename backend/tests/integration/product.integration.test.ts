import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import { buildApp } from "../../src/app.js";
import { setupMongoMemory, teardownMongoMemory } from "../helpers/mongo-memory.js";

describe("📦 Integração: Produtos (Fluxo Completo e Erros)", () => {
  jest.setTimeout(60000);
  let app: any; // ✅ Mudado para let
  let adminToken: string;

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp(); // ✅ ADICIONADO AWAIT
    await app.ready();

    await app.inject({
      method: "POST",
      url: "/api/v1/auth/admin/register",
      payload: { name: "Admin Teste", email: "admin@teste.com", password: "Senha@123456" }
    });

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/admin/login",
      payload: { email: "admin@teste.com", password: "Senha@123456" }
    });

    adminToken = loginRes.json().data?.token || loginRes.json().token;
  });

  afterAll(async () => {
    if (app) await app.close();
    await teardownMongoMemory();
  });

  it("✅ deve criar um produto e buscá-lo pelo _id", async () => {
    const productData = {
      name: "Mouse Wireless",
      description: "Mouse óptico sem fio", // ✅ Descrição obrigatória adicionada
      price: 89.90,
      stock: 50,
      category: "periféricos",
      active: true // ✅ Ativo adicionado
    };
    // ... rest of the test
  });
});