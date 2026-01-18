import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { ProductModel } from '../models/product.model.js';
import { env } from '../config/env.js';
import logger from '../plugins/logger.js';

async function seedProducts(): Promise<void> {
  try {
    // 1. Conexão Segura
    await mongoose.connect(env.MONGO_URI);
    logger.info("Conectado ao MongoDB para seeding de produtos...");

    // 2. Limpeza de Segurança (Proteção contra duplicidade no teste)
    const deleted = await ProductModel.deleteMany({});
    logger.info({ count: deleted.deletedCount }, "Coleção de produtos limpa.");

    // 3. Geração de Massa de Dados (100 itens para testar paginação)
    const categories = ['Eletrônicos', 'Periféricos', 'Hardware', 'Acessórios'];
    
    const products = Array.from({ length: 100 }).map(() => ({
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 5000 })),
      stock: faker.number.int({ min: 0, max: 150 }),
      category: faker.helpers.arrayElement(categories),
      description: faker.commerce.productDescription(),
      active: true
    }));

    // 4. Inserção em Lote (Performance de Produção)
    await ProductModel.insertMany(products);

    logger.info("[SEED] 100 Produtos criados com sucesso.");
  } catch (error: unknown) {
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      "[SEED_ERROR] Falha ao popular produtos"
    );
    process.exit(1);
  } finally {
    // 5. Fechamento Limpo
    await mongoose.disconnect();
    logger.info("Conexão encerrada.");
    process.exit(0);
  }
}

seedProducts();