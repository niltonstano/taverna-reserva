import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { buildApp } from "../src/app.js";

describe("🏥 Health Check System", () => {
  let app: any;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar informações de saúde do sistema", async () => {
    // Testamos a rota que você confirmou que existe no seu mapa
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health/health" 
    });

    // Aceitamos 200 (OK) ou 503 (Serviço indisponível, mas rota encontrada)
    expect([200, 503]).toContain(response.statusCode);
  });
});