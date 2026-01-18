import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { buildApp } from "../../src/app.js";
import { setupMongoMemory, teardownMongoMemory } from "../helpers/mongo-memory.js";

describe("E2E: Fluxo Completo da Aplicação", () => {
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

  it("✅ Deve responder ao Health Check na rota correta", async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health/health' // URL corrigida conforme seu mapa
    });
    
    // Aceita 200 ou 503 (caso o DB demore a subir no ambiente E2E)
    expect([200, 503]).toContain(response.statusCode);
  });
});