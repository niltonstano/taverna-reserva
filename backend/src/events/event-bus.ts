export enum EventNames {
  ORDER_CREATED = "order.created",
  ORDER_PAID = "order.paid",
  STOCK_LOW = "stock.low",
}

type EventHandler<T = any> = (payload: T) => Promise<void> | void;

class EventBus {
  private handlers = new Map<EventNames, EventHandler[]>();

  subscribe<T>(event: EventNames, handler: EventHandler<T>): void {
    const list = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...list, handler]);
  }

  /**
   * ⚡ Publicação Ultra-Light
   * Dispara todos os handlers em paralelo.
   * O allSettled garante que todos terminem, independente de sucesso ou falha.
   */
  publish<T>(event: EventNames, payload: T): void {
    const handlers = this.handlers.get(event) ?? [];

    // Dispara e esquece (Fire and forget)
    // Se algum falhar, o erro fica contido na respectiva Promise do array.
    Promise.allSettled(
      handlers.map((handler) => Promise.resolve(handler(payload))),
    );
  }
}

export const bus = new EventBus();
