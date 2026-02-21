import { IOrderDTO } from "../types/order.type.js";
import { bus, EventNames } from "./event-bus.js";

/**
 * 🎧 Listener: Order Created
 * Disparado automaticamente via EventBus quando um checkout termina com sucesso.
 */
export const setupOrderCreatedListener = () => {
  bus.subscribe<IOrderDTO>(EventNames.ORDER_CREATED, async (order) => {
    // 1. Log de monitoramento
    console.log(
      `[EVENT] Pedido Criado: ${order.id} | Cliente: ${order.customerEmail}`,
    );

    // 2. Exemplo: Envio de e-mail (Aqui você chamaria seu MailService)
    // await mailService.sendOrderConfirmation(order.customerEmail, order);

    // 3. Integração com Logística ou CRM
    // await crmService.registerSale(order);
  });
};
