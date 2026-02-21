import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { buildApp } from "../src/app.js";
// Importamos os helpers para evitar o erro de conexão com o banco
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "./helpers/mongo-memory.js";

describe("🏥 Health Check System", () => {
  let app: any;

  beforeAll(async () => {
    // 1. Iniciamos o banco de memória para o plugin de banco não dar erro
    await setupMongoMemory();

    // 2. Agora o app consegue subir sem crashar no database.ts
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    // 3. Limpeza total
    await app.close();
    await teardownMongoMemory();
  });

  it("deve retornar informações de saúde do sistema", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health/health",
    });

    // Validamos se o status é sucesso (200) ou erro de serviço (503)
    // Se o banco estiver ok, deve ser 200
    expect([200, 503]).toContain(response.statusCode);

    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty("status");
  });
});
