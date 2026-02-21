import logger from "../plugins/logger.js";
import { setupOrderCreatedListener } from "./order-created.listener.js";

/**
 * 📢 Gerenciador de Eventos
 * Responsável por centralizar o registro de listeners.
 * Chamado no startup do servidor (server.ts).
 */
export const initEvents = () => {
  // Registra os listeners individualmente
  setupOrderCreatedListener();

  const mode = process.env.NODE_ENV || "development";
  if (mode === "development") {
    logger.info("📡 Event Bus: Listeners registrados com sucesso.");
  }
};

/**
 * Função para cleanup de eventos
 * Chamada no Graceful Shutdown do server.ts
 */
export async function closeEventBus(): Promise<void> {
  logger.info("🔕 Encerrando barramento de eventos...");
  // Se futuramente usar Redis/BullMQ, o fechamento da conexão viria aqui
}
