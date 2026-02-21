import { PaymentData } from "../types/order.type.js";

export interface IPaymentProvider {
  /**
   * Gera o PIX para processamento automático
   */
  generatePix(orderId: string, amountCents: number): Promise<PaymentData>;

  /**
   * Gera o link de redirecionamento para o WhatsApp
   */
  generatePaymentLink(
    orderId: string,
    amountCents: number,
    customerEmail: string,
  ): string;
}

/**
 * Implementação Mock para Testes/Dev
 */
export class DummyPaymentProvider implements IPaymentProvider {
  async generatePix(
    orderId: string,
    amountCents: number,
  ): Promise<PaymentData> {
    return {
      qr_code: `PIX_TA_RESERVA_${orderId}`,
      qr_code_base64: "YmFzZTY0X2V4YW1wbGU=",
      ticket_url: `https://checkout.taverna.com/pay/${orderId}`,
      payment_id: Date.now(),
    };
  }

  generatePaymentLink(
    orderId: string,
    amountCents: number,
    customerEmail: string,
  ): string {
    const message = `Olá! Quero pagar o pedido ${orderId} no valor de R$ ${(amountCents / 100).toFixed(2)}`;
    return `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
  }
}
