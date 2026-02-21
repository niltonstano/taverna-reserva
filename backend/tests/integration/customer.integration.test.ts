import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import "dotenv/config";
import { buildApp } from "../../src/app.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("👥 Integração: Gerenciamento de Clientes (Coverage 100%)", () => {
  let app: any;
  let adminToken: string;
  let targetCustomerId: string;

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp();
    await app.ready();

    const adminEmail = `admin.${Date.now()}@taverna.com`;
    const customerEmail = `customer.${Date.now()}@taverna.com`;
    const password = "Password123!";

    // 1. Registro de Admin Real (usa o adminRepo internamente)
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/admin/register",
      payload: { name: "Nilton Admin", email: adminEmail, password },
    });

    // 2. Registro de Cliente (para ser o alvo dos testes de admin)
    const regRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/customer/register",
      payload: { name: "Cliente Teste", email: customerEmail, password },
    });
    const regBody = JSON.parse(regRes.payload);
    targetCustomerId = regBody.user.id;

    // 3. Login como Admin (para obter o token com role 'admin')
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/admin/login",
      payload: { email: adminEmail, password },
    });

    const loginBody = JSON.parse(loginRes.payload);
    adminToken = loginBody.token;
  });

  afterAll(async () => {
    if (app) await app.close();
    await teardownMongoMemory();
  });

  it("✅ [GET /profile/:id] Deve retornar o perfil do cliente", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/customer/profile/${targetCustomerId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
  });

  it("✅ [GET /] Deve listar todos os clientes (listAll)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/customer/",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(Array.isArray(body)).toBe(true);
  });

  it("✅ [GET /all] Deve buscar clientes com paginação (getAll)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/customer/all",
      query: { page: "1", limit: "10" },
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty("pagination");
  });

  it("✅ [POST /logout] Deve realizar logout", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/customer/logout",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(response.statusCode).toBe(200);
  });

  it("✅ [DELETE /:id] Deve deletar o cliente", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/api/v1/customer/${targetCustomerId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(response.statusCode).toBe(204);
  });
});
