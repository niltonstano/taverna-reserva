import { IPaymentProvider } from "../interfaces/payment.interface.js";

export class WhatsAppService implements IPaymentProvider {
  private readonly PHONE_NUMBER = "5511999999999";

  /**
   * Constrói a URL do WhatsApp com a mensagem formatada
   */
  public generatePaymentLink(
    orderId: string,
    totalCents: number,
    email: string,
  ): string {
    const totalFormatted = (totalCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    // Mensagem formatada para o lojista ler rápido
    const message =
      `Olá! Acabei de fazer um pedido na *Taverna Reserva* 🍷%0A%0A` +
      `🆔 *Pedido:* ${orderId}%0A` +
      `📧 *Email:* ${email}%0A` +
      `💰 *Total:* ${totalFormatted}%0A%0A` +
      `*Pode me enviar o QR Code para o pagamento?*`;

    return `https://wa.me/${this.PHONE_NUMBER}?text=${message}`;
  }

  /**
   * Implementação da interface IPaymentProvider
   */
  public async generatePix(
    orderId: string,
    amountCents: number,
    customerEmail: string = "cliente@email.com",
  ): Promise<any> {
    const link = this.generatePaymentLink(orderId, amountCents, customerEmail);

    return {
      qr_code: "WHATSAPP_LINK", // Identificador para o front-end saber que não é um QR real
      qr_code_base64: "",
      ticket_url: link, // URL para o botão "Pagar via WhatsApp"
      payment_id: `WA-${Date.now()}`,
      payment_url: link,
    };
  }
}
