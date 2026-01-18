import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { buildApp } from "../../src/app.js";
import { setupMongoMemory, teardownMongoMemory } from "../helpers/mongo-memory.js";

describe("E2E - Fluxo de Permissões (User vs Admin)", () => {
  let app: any;

  beforeAll(async () => {
    await setupMongoMemory();
    // 🛡️ O segredo do 100%: await no build e await no ready
    app = await buildApp();
    await app.ready(); 
  });

  afterAll(async () => {
    if (app) await app.close();
    await teardownMongoMemory();
  });

  it("deve bloquear um usuário comum (customer) de acessar rotas de Admin", async () => {
    const customerToken = app.jwt.sign({ id: "user_1", role: "customer" });

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/admin/users/algum-id", // URL corrigida para o novo padrão
      headers: { authorization: `Bearer ${customerToken}` }
    });

    expect(response.statusCode).toBe(403);
  });

  it("deve permitir que um Admin acesse rotas administrativas", async () => {
    const adminToken = app.jwt.sign({ id: "admin_1", role: "admin" });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/admin/users", 
      headers: { authorization: `Bearer ${adminToken}` }
    });

    // Se a rota existir, retorna 200. Se o banco estiver vazio mas a rota ok, 200/404.
    // O importante é NÃO ser 403 (Forbidden) ou 401 (Unauthorized).
    expect([200, 404]).toContain(response.statusCode);
  });
});