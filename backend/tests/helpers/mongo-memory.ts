import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Tipamos explicitamente para remover o erro de "implicit any"
let replset: MongoMemoryReplSet | undefined;

export const setupMongoMemory = async (): Promise<void> => {
  // Evita múltiplas conexões se o teste chamar o setup mais de uma vez
  if (mongoose.connection.readyState !== 0) return;

  // IMPORTANTE: WiredTiger + Replica Set é obrigatório para Transações
  replset = await MongoMemoryReplSet.create({ 
    replSet: { 
      storageEngine: 'wiredTiger', 
      count: 1 
    } 
  });
  
  const uri = replset.getUri();
  
  await mongoose.connect(uri);

  // Ping para garantir que o banco está pronto
  await mongoose.connection.db?.admin().command({ ping: 1 });
};

export const teardownMongoMemory = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (replset) {
    await replset.stop();
  }
};

export const clearDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) return;

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * ✅ Exporta a conexão para o CheckoutService usar nos testes
 */
export const getMongooseConnection = (): mongoose.Connection => {
  return mongoose.connection;
};

// Apelidos (Aliases) para manter compatibilidade com seus códigos
export const connectMockDB = setupMongoMemory;
export const disconnectMockDB = teardownMongoMemory;
export const clearMockDB = clearDatabase;