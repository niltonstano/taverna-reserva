import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { buildApp } from "../../src/app.js";
import { setupMongoMemory, teardownMongoMemory } from "../helpers/mongo-memory.js";
import mongoose from "mongoose";

describe("🛒 Carrinho - Integração", () => {
  let app: any;
  let userToken: string;
  const BASE_URL = "/api/v1/cart"; // 👈 Prefixo corrigido conforme o novo routes.ts

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp();
    await app.ready();

    // Gera um token válido para os testes
    userToken = app.jwt.sign({ 
      id: new mongoose.Types.ObjectId().toHexString(), 
      role: 'customer' 
    });
  });

  afterAll(async () => {
    await app.close();
    await teardownMongoMemory();
  });

  it("✅ Deve retornar 200 ao buscar carrinho", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${BASE_URL}/`, // Bate em /api/v1/cart/
      headers: {
        authorization: `Bearer ${userToken}`
      }
    });

    // Se der 404 aqui, o log abaixo vai te mostrar onde a rota realmente está
    if (response.statusCode === 404) {
      console.log("Rota não encontrada. Mapa atual:");
      console.log(app.printRoutes());
    }

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty("items");
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("🛡️ Deve retornar 401 ao buscar carrinho sem token", async () => {
    const response = await app.inject({
      method: "GET",
      url: `${BASE_URL}/`
    });

    expect(response.statusCode).toBe(401);
  });
});