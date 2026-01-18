// events/index.js
import logger from "../plugins/logger.js";
import "./order-created.listener.js";

/**
 * 📢 Gerenciador de Eventos
 * Responsável por centralizar o registro de listeners e
 * garantir que mensagens em processamento sejam finalizadas.
 */

// Log condicional para evitar poluição em logs de produção, mas mantendo rastreabilidade
const mode = process.env.NODE_ENV || "development";

if (mode === "development") {
  logger.info(
    "📡 Event Bus: Todos os listeners foram registrados com sucesso."
  );
}

/**
 * Função opcional para cleanup de eventos
 * Se você usar EventEmitter, BullMQ ou RabbitMQ,
 * chame esta função no Graceful Shutdown do server.ts
 */
export async function closeEventBus(): Promise<void> {
  logger.info("🔕 Encerrando barramento de eventos...");
  // Aqui você fecharia conexões de workers ou removeria listeners globais
  // Exemplo: eventEmitter.removeAllListeners();
}
