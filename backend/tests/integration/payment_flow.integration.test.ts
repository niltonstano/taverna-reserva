import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PaymentService } from "../../src/services/payment.service.js";
import { WhatsAppService } from "../../src/services/whatsapp.service.js";

describe("Flow: Payment Service + WhatsApp Link", () => {
  let paymentService: PaymentService;
  let whatsappService: WhatsAppService;
  let productRepoMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 1. Corrigindo o erro de 'never' com mockImplementation
    productRepoMock = {
      updateStock: jest.fn().mockImplementation(() => Promise.resolve(true)),
    };

    // 2. Instancia as classes importadas
    whatsappService = new WhatsAppService();
    paymentService = new PaymentService(productRepoMock, whatsappService);
  });

  it("deve orquestrar o fluxo de pagamento PIX via WhatsApp", async () => {
    const orderData = {
      id: "ORD-TAVERNA-01",
      total: 15000,
      email: "cliente@taverna.com",
      method: "pix",
    };

    const result = await paymentService.processPayment(orderData);

    expect(result.type).toBe("whatsapp_redirection");
    // Verificamos se o retorno contém os dados que o WhatsAppService deveria gerar
    expect(result.data.ticket_url).toContain("wa.me");
    expect(result.data.ticket_url).toContain("ORD-TAVERNA-01");
  });
});
