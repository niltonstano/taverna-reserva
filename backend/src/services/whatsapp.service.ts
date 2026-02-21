import { IPaymentProvider } from "../interfaces/payment.interface.js";

export class WhatsAppService implements IPaymentProvider {
  private readonly PHONE_NUMBER = "5511999999999"; // Substitua pelo seu número

  public generatePaymentLink(
    orderId: string,
    totalCents: number,
    email: string,
  ): string {
    const totalFormatted = (totalCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const message =
      `Olá! Acabei de fazer um pedido na *Taverna Reserva* 🍷%0A%0A` +
      `🆔 *Pedido:* ${orderId}%0A` +
      `📧 *Email:* ${email}%0A` +
      `💰 *Total:* ${totalFormatted}%0A%0A` +
      `*Pode me enviar o QR Code para o pagamento?*`;

    return `https://wa.me/${this.PHONE_NUMBER}?text=${message}`;
  }
}
