import 'dotenv/config'; 
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { buildApp } from "../../src/app.js";
import { setupMongoMemory, teardownMongoMemory } from "../helpers/mongo-memory.js";

describe("👥 Integração: Gerenciamento de Clientes", () => {
  let app: any;

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await teardownMongoMemory();
  });

  it("✅ Deve inicializar o módulo e responder health check", async () => {
    expect(app).toBeDefined();
    
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health/health' // URL corrigida
    });
    
    expect([200, 503]).toContain(response.statusCode);
  });
});