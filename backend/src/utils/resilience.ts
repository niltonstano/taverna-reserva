import logger from "../plugins/logger.js";

export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 5000,
): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 1) {
      logger.fatal("🔥 Falha crítica após esgotar tentativas de resiliência.");
      process.exit(1);
    }

    logger.error(
      {
        err: err instanceof Error ? err.message : err,
        remaining: retries - 1,
        nextRetry: `${delay / 1000}s`,
      },
      "⚠️ Falha detectada. Tentando novamente...",
    );

    await new Promise((res) => setTimeout(res, delay));
    return withRetry(fn, retries - 1, delay);
  }
};
