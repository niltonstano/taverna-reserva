import { describe, expect, it } from "@jest/globals";
import { WhatsAppService } from "../../src/services/whatsapp.service";

describe("WhatsAppService", () => {
  const whatsappService = new WhatsAppService();

  it("deve gerar um link do WhatsApp corretamente formatado", () => {
    const orderId = "ORD123";
    const totalCents = 15050;
    const email = "nilton@taverna.com";

    const link = whatsappService.generatePaymentLink(
      orderId,
      totalCents,
      email,
    );

    expect(link).toContain("https://wa.me/5511999999999");
    expect(link).toContain("ORD123");
    // Verifica os valores reais sem encoding
    expect(link).toContain("nilton@taverna.com");
    expect(link).toContain("150,50");
  });

  it("deve implementar generatePix retornando o link do WhatsApp", async () => {
    const result = await whatsappService.generatePix(
      "ORD789",
      5000,
      "test@test.com",
    );
    expect(result.qr_code).toBe("WHATSAPP_LINK");
    expect(result.ticket_url).toContain("wa.me");
  });
});
