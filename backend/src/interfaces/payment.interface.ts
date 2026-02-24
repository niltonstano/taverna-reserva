// src/interfaces/payment.interface.ts
import { PaymentData } from "../types/order.type.js";

/**
 * 🍷 IPaymentProvider
 * Contrato universal para meios de pagamento da Taverna.
 */
export interface IPaymentProvider {
  /**
   * Gera os dados de pagamento (PIX ou Link de Terceiros).
   * O customerEmail é opcional para manter compatibilidade com Gateways que não o exigem,
   * mas essencial para o nosso fluxo de WhatsApp.
   */
  generatePix(
    orderId: string,
    amountCents: number,
    customerEmail?: string,
  ): Promise<PaymentData>;

  /**
   * Gera o link de redirecionamento direto (WhatsApp ou Checkout Externo).
   */
  generatePaymentLink(
    orderId: string,
    amountCents: number,
    customerEmail: string,
  ): string;
}

/**
 * 🛠️ DummyPaymentProvider
 * Implementação de Mock para Testes/Dev.
 * Agora 100% compatível com o novo contrato.
 */
export class DummyPaymentProvider implements IPaymentProvider {
  /**
   * Simula a geração de um PIX.
   * Note que aceitamos o customerEmail mas não precisamos usá-lo no Mock se não quiser.
   */
  async generatePix(
    orderId: string,
    amountCents: number,
    customerEmail?: string,
  ): Promise<PaymentData> {
    return {
      qr_code: `PIX_TA_RESERVA_${orderId}`,
      qr_code_base64: "YmFzZTY0X2V4YW1wbGU=",
      ticket_url: this.generatePaymentLink(
        orderId,
        amountCents,
        customerEmail || "dev@taverna.com",
      ),
      payment_id: Date.now(),
    };
  }

  /**
   * Simula o link do WhatsApp com mensagem básica.
   */
  generatePaymentLink(
    orderId: string,
    amountCents: number,
    customerEmail: string,
  ): string {
    const valorFormatado = (amountCents / 100).toFixed(2);
    const message = `Olá! Sou o cliente ${customerEmail}. Quero pagar o pedido ${orderId} no valor de R$ ${valorFormatado}`;

    return `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
  }
}
