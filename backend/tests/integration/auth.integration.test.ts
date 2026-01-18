import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { buildApp } from "../../src/app.js";
import { setupMongoMemory, teardownMongoMemory } from "../helpers/mongo-memory.js";

describe("🔐 Integração: Autenticação Completa", () => {
  let app: any;
  
  // ✅ Rota exata descoberta pelo seu mapa de rotas
  const REGISTER_URL = "/api/v1/auth/customer/register";

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await teardownMongoMemory();
  });

  it("Deve retornar 400 ao tentar registrar um email já existente", async () => {
    const payload = { 
      name: "Nilton Teste", 
      email: "duplicado@teste.com", 
      password: "Password123!" 
    };

    // Primeiro registro
    await app.inject({ 
      method: "POST", 
      url: REGISTER_URL, 
      payload 
    });

    // Segundo registro (Deve falhar)
    const res = await app.inject({ 
      method: "POST", 
      url: REGISTER_URL, 
      payload 
    });

    // Se a rota existir, não pode ser 404. Deve ser 400 (Bad Request).
    expect(res.statusCode).toBe(400);
  });

  it("Deve barrar registro com senha fraca", async () => {
    const res = await app.inject({
      method: 'POST',
      url: REGISTER_URL,
      payload: { 
        name: "Nilton",
        email: 'senhafraca@teste.com', 
        password: '123' 
      }
    });
    expect(res.statusCode).toBe(400);
  });
});