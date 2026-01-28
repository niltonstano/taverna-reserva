import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { buildApp } from "../../src/app.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("Integração - Ordens e Permissões", () => {
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

  it("deve permitir ADMIN acessar rota de ADMIN", async () => {
    const adminId = new mongoose.Types.ObjectId();

    // Inserimos o admin diretamente no banco para a rota /profile encontrá-lo
    await mongoose.connection.collection("admins").insertOne({
      _id: adminId,
      name: "Integration Admin",
      email: "admin-int@test.com",
      password: "hashed_password",
      role: "admin",
    });

    const token = app.jwt.sign({
      id: adminId.toString(),
      role: "admin",
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/admin/profile",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
  });
});
