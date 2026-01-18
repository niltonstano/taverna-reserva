import logger from "../plugins/logger.js";

// 1. Tipagem forte para os nomes de eventos
export enum EventNames {
  ORDER_CREATED = "order.created",
  ORDER_PAID = "order.paid",
  STOCK_LOW = "stock.low",
}

type EventHandler<T = any> = (payload: T) => Promise<void> | void;

class EventBus {
  private handlers = new Map<EventNames, EventHandler[]>();

  subscribe<T>(event: EventNames, handler: EventHandler<T>) {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  // Removido o 'await' do loop para não travar o processo principal
  publish<T>(event: EventNames, payload: T) {
    const handlers = this.handlers.get(event) ?? [];
    
    // Executamos em background
    handlers.forEach(async (handler) => {
      try {
        await handler(payload);
      } catch (err) {
        // Segurança Máxima: Erro no listener não afeta a requisição do usuário
        logger.error({ err, event, payload }, "❌ Erro ao processar listener de evento");
      }
    });
  }
}

export const eventBus = new EventBus();