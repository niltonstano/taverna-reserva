import fp from "fastify-plugin";
import mongoose from "mongoose";

export interface DatabasePluginOptions {
  uri: string;
}

export default fp<DatabasePluginOptions>(async (app, opts) => {
  if (!opts.uri) {
    app.log.error("❌ Database Plugin: MONGO_URI não fornecida.");
    throw new Error("MONGO_URI is required");
  }

  try {
    mongoose.set("strictQuery", true);

    // 💡 SEGURANÇA PARA TESTES: Só conecta se não houver conexão ativa
    if (mongoose.connection.readyState === 0) {
      app.log.info("🔌 Conectando ao MongoDB...");
      await mongoose.connect(opts.uri, {
        serverSelectionTimeoutMS: 5000,
      });
      app.log.info("✅ MongoDB conectado com sucesso.");
    } else {
      app.log.info(
        "📡 MongoDB: Reutilizando conexão ativa (Ambiente de Teste)",
      );
    }

    app.decorate("db", mongoose.connection);

    app.addHook("onClose", async () => {
      // Só desconecta se não for ambiente de teste, para evitar fechar o In-Memory antes da hora
      if (process.env.NODE_ENV !== "test") {
        app.log.warn("🔌 Fechando conexão com MongoDB...");
        await mongoose.disconnect();
      }
    });
  } catch (error) {
    app.log.error({ err: error }, "❌ Erro fatal na conexão com MongoDB");
    throw error;
  }
});
