import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

/**
 * 🔴 IMPORTANTE: Registro de Schemas
 * Importamos os modelos para garantir que o Mongoose conheça os Schemas
 * antes de rodar os testes, evitando o erro "MissingSchemaError".
 */
import "../../src/models/cart.model.js";
import "../../src/models/order.model.js";
import "../../src/models/product.model.js";

let replset: MongoMemoryReplSet | undefined;

/**
 * ✅ CONFIGURAÇÃO DE REPLICA SET PARA TRANSAÇÕES E STRESS TESTS
 * Otimizado com 1 nó para estabilidade e verificação de estado Primary.
 */
export const setupMongoMemory = async (): Promise<void> => {
  // Evita múltiplas conexões simultâneas se já estiver conectado
  if (mongoose.connection.readyState !== 0) return;

  try {
    console.log("⏳ Iniciando MongoDB Memory ReplicaSet...");

    // 1 nó é suficiente para habilitar transações e evita erros de eleição/timeout
    replset = await MongoMemoryReplSet.create({
      replSet: {
        name: "rs0",
        count: 1,
        storageEngine: "wiredTiger", // Necessário para ReplicaSet/Transações
      },
    });

    const uri = replset.getUri();

    // Configurações de timeout robustas
    await mongoose.connect(uri, {
      connectTimeoutMS: 20000,
      socketTimeoutMS: 60000,
      retryWrites: true,
    });

    /**
     * 🛑 AGUARDAR O REPLICA SET ESTABILIZAR
     * Verificamos se o nó já assumiu o papel de Primary (ismaster)
     * antes de tentar qualquer operação de escrita ou índices.
     */
    let isMaster = false;
    let attempts = 0;
    while (!isMaster && attempts < 15) {
      const status = await mongoose.connection.db
        ?.admin()
        .command({ isMaster: 1 });
      if (status?.ismaster) {
        isMaster = true;
      } else {
        attempts++;
        console.log(
          `--- Aguardando eleição do Primary (Tentativa ${attempts}/15)...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!isMaster) {
      throw new Error(
        "O MongoDB ReplicaSet não estabilizou como Primary a tempo.",
      );
    }

    /**
     * 🟢 PASSO CRÍTICO: Pré-build de Índices
     * Forçamos a criação sequencial para evitar o erro "InterruptedDueToReplStateChange".
     */
    const OrderModel = mongoose.model("Order");
    const ProductModel = mongoose.model("Product");

    await OrderModel.ensureIndexes();
    await ProductModel.ensureIndexes();

    console.log("✅ MongoDB ReplicaSet pronto e Índices buildados.");
  } catch (error) {
    console.error("❌ Falha ao iniciar MongoDB Memory ReplicaSet:", error);
    // Limpeza em caso de falha no boot
    if (replset) {
      await replset.stop();
      replset = undefined;
    }
    throw error;
  }
};

/**
 * 🛑 FINALIZAÇÃO DO AMBIENTE (Limpeza segura)
 */
export const teardownMongoMemory = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (replset) {
      await replset.stop({ doCleanup: true, force: true });
      replset = undefined;
    }

    console.log("👋 MongoDB Memory ReplicaSet finalizado.");
  } catch (error) {
    console.error("❌ Erro ao desligar MongoDB:", error);
  }
};

/**
 * 🧹 LIMPEZA ENTRE TESTES
 */
export const clearDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;

  try {
    const collections = mongoose.connection.collections;
    const promises = Object.values(collections).map((col) =>
      col.deleteMany({}),
    );
    await Promise.all(promises);
  } catch (error) {
    console.error("❌ Erro ao limpar database:", error);
  }
};

/**
 * 🛠️ UTILITÁRIOS E ALIASES
 */
export const getMongooseConnection = (): mongoose.Connection =>
  mongoose.connection;
export const connectMockDB = setupMongoMemory;
export const disconnectMockDB = teardownMongoMemory;
export const clearMockDB = clearDatabase;
