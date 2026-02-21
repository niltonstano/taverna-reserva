import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { buildApp } from "../../src/app.js";
import { AuthResult } from "../../src/types/auth.type.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

jest.setTimeout(30000);

describe("Auth Routes - Integração Real", () => {
  let app: any;

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    await teardownMongoMemory();
  });

  describe("Fluxo de Clientes (Customer)", () => {
    const customerData = {
      name: "Nilton Integration",
      email: "nilton.test@taverna.com",
      password: "SenhaForte123!",
    };

    it("✅ Deve registrar, impedir duplicata e logar", async () => {
      // 1. Registro
      const regRes = await app.inject({
        method: "POST",
        url: "/api/v1/auth/customer/register",
        payload: customerData,
      });
      expect(regRes.statusCode).toBe(201);

      // 2. Tentativa de Duplicata (Valida Error Handler -> 409)
      const dupRes = await app.inject({
        method: "POST",
        url: "/api/v1/auth/customer/register",
        payload: customerData,
      });
      expect(dupRes.statusCode).toBe(409);

      // 3. Login
      const loginRes = await app.inject({
        method: "POST",
        url: "/api/v1/auth/customer/login",
        payload: {
          email: customerData.email,
          password: customerData.password,
        },
      });

      expect(loginRes.statusCode).toBe(200);
      const body = JSON.parse(loginRes.body) as AuthResult;
      expect(body.token).toBeDefined();
      expect(body.user.role).toBe("customer");
      // Verifica se o token é um JWT válido
      expect(body.token.split(".").length).toBe(3);
    });
  });

  describe("Fluxo de Administradores (Admin)", () => {
    it("✅ Deve registrar um admin com permissões", async () => {
      const adminData = {
        name: "Admin Taverna",
        email: "admin@taverna.com",
        password: "AdminPassword123!",
        permissions: ["manage_orders", "manage_products"],
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/admin/register",
        payload: adminData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.user.role).toBe("admin");
      expect(body.user.email).toBe(adminData.email);
    });
  });
});
