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

    // Limpeza radical e inserção direta
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection("admins").deleteMany({});
      await mongoose.connection.db.collection("admins").insertOne({
        _id: adminId,
        name: "Super Admin",
        email: "admin@e2e.com",
        password: "hashed_password_here", // Não importa a senha, usaremos token direto
        role: "admin",
      });
    }

    // Geramos o token manualmente usando a chave secreta do app
    // Isso evita falhas de login/registro completamente
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
