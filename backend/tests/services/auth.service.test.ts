import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { buildApp } from "../../src/app.js";

describe("Auth Routes", () => {
  let app: any;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar erro 400 quando dados de registro forem inválidos", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/customer/register", // Rota completa
      payload: {
        email: "email-invalido", // Isso deve disparar o Zod (400)
        password: "123"
      }
    });

    // Se ainda der 404, o console vai nos dizer o porquê
    if (response.statusCode === 404) console.log(app.printRoutes());

    expect(response.statusCode).toBe(400);
  });
});