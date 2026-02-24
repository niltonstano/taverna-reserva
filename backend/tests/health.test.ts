import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { buildApp } from "../src/app.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "./helpers/mongo-memory.js";

describe("🏥 Health Check System", () => {
  let app: any;

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await teardownMongoMemory();
  });

  it("✅ Deve retornar 200 e o status 'ok' do sistema", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    });

    const payload = JSON.parse(response.payload);

    expect(response.statusCode).toBe(200);
    expect(payload).toHaveProperty("status", "ok");
    expect(payload.dependencies.database).toBe("up");
  });
});
