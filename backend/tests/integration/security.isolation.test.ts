/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { Types } from "mongoose";
import request from "supertest";
import { buildApp } from "../../src/app.js";
import { OrderModel } from "../../src/models/order.model.js";
import { generateTestToken } from "../helpers/auth-helper.js";
import {
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("🛡️ Segurança - Isolamento de Dados (Anti-IDOR)", () => {
  let appInstance: any;

  beforeAll(async () => {
    try {
      await setupMongoMemory();
      appInstance = await buildApp();
      await appInstance.ready();
    } catch (error) {
      console.error("❌ Erro no Setup de Segurança:", error);
      throw error;
    }
  });

  afterAll(async () => {
    // 🛡️ Optional chaining para evitar o erro "Cannot read properties of undefined (reading 'close')"
    if (appInstance) {
      await appInstance.close();
    }
    await teardownMongoMemory();
  });

  it("🚫 Não deve permitir que um usuário veja o pedido de outro", async () => {
    // 1. Criamos um ID para a Vítima e o pedido dela
    const victimId = new Types.ObjectId();
    const orderVictim = await OrderModel.create({
      userId: victimId,
      customerEmail: "vitima@taverna.com",
      address: "Rua das Oliveiras, 404",
      zipCode: "12345-678",
      items: [
        {
          productId: new Types.ObjectId(),
          name: "Vinho Tinto Reserva",
          quantity: 1,
          priceCents: 15000,
          subtotalCents: 15000,
        },
      ],
      shipping: {
        company: "TavernaExpress",
        service: "Standard",
        priceCents: 2000,
        deadline: 5,
      },
      shippingPriceCents: 2000,
      totalPriceCents: 17000,
      status: "pending",
      idempotencyKey: `security-test-${victimId.toHexString()}-${Date.now()}`,
    });

    // 2. Criamos um Atacante malicioso com seu próprio token legítimo
    const attackerId = new Types.ObjectId().toHexString();
    const attackerToken = generateTestToken(attackerId, "attacker@evil.com");

    // 3. O Atacante tenta acessar o ID do pedido da Vítima
    const response = await request(appInstance.server)
      .get(`/api/v1/orders/${orderVictim._id}`)
      .set("Authorization", `Bearer ${attackerToken}`);

    // VALIDAÇÃO: Bloqueio deve retornar 403 (Proibido) ou 404 (Para não vazar que o ID existe)
    expect([403, 404]).toContain(response.status);

    if (response.body && response.body.success !== undefined) {
      expect(response.body.success).toBe(false);
    }

    console.log(
      `✅ Anti-IDOR: Status ${response.status} validado para o atacante.`,
    );
  });
});
