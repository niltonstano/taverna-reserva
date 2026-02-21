import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { buildApp } from "../../src/app.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("E2E - Fluxo de Permissões (User vs Admin)", () => {
  let app: any;
  let adminToken: string;
  const adminId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp();
    await app.ready();

    if (mongoose.connection.db) {
      await mongoose.connection.db.collection("admins").deleteMany({});
      await mongoose.connection.db.collection("admins").insertOne({
        _id: adminId,
        name: "Super Admin",
        email: "admin@e2e.com",
        password: "hashed_password_here",
        role: "admin",
      });
    }

    adminToken = app.jwt.sign({
      id: adminId.toString(),
      role: "admin",
    });
  });

  afterAll(async () => {
    if (app) await app.close();
    await teardownMongoMemory();
  });

  it("deve bloquear CUSTOMER de acessar rota de ADMIN", async () => {
    // 💡 Opcional: Silenciar o logger apenas para este teste se você quiser o console 100% limpo
    // const logSpy = jest.spyOn(app.log, 'error').mockImplementation(() => {});

    const customerToken = app.jwt.sign({
      id: new mongoose.Types.ObjectId().toString(),
      role: "customer",
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/admin/profile",
      headers: { authorization: `Bearer ${customerToken}` },
    });

    expect(response.statusCode).toBe(403);

    // logSpy.mockRestore();
  });

  it("deve permitir ADMIN acessar rota administrativa", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/admin/profile",
      headers: { authorization: `Bearer ${adminToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });
});
