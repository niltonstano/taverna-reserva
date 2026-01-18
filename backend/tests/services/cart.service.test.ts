import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { buildApp } from "../../src/app.js";
import { setupMongoMemory, teardownMongoMemory } from "../helpers/mongo-memory.js";

describe("Carrinho - Integração", () => {
  let app: any;
  const API_URL = "/api/v1/cart";

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp();
    await app.ready(); 
  });

  afterAll(async () => {
    await app.close();
    await teardownMongoMemory();
  });

  it("Deve retornar 200 ao buscar carrinho (ou 401 se não logado)", async () => {
    const response = await app.inject({
      method: 'GET',
      url: `${API_URL}/`
    });
    // Como a rota é protegida, o esperado agora é 401 ou 200 (se enviar token)
    // O importante é que NÃO dê mais erro de schema (500)
    expect([200, 401]).toContain(response.statusCode);
  });
});