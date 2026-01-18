import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/admin.js';
import { CustomerModel } from '../models/customer.model.js';
import { env } from '../config/env.js';
import logger from '../plugins/logger.js';

// Interfaces
import { IAdmin } from '../interfaces/admin.interface.js'; 
import { ICustomer } from '../interfaces/customer.interface.js';

/**
 * ✅ DEFINIÇÃO DOS TIPOS (O que estava faltando)
 * Omitimos os campos que o MongoDB gera automaticamente
 */
type AdminCreateData = Omit<IAdmin, '_id' | 'createdAt' | 'updatedAt'>;
type CustomerCreateData = Omit<ICustomer, '_id' | 'createdAt' | 'updatedAt'>;

async function seedUsers(): Promise<void> {
  try {
    // 1. Conexão
    await mongoose.connect(env.MONGO_URI);
    logger.info("Conectado ao MongoDB para seeding...");

    // 2. Limpeza atômica das coleções
    await Promise.all([
      AdminModel.deleteMany({}),
      CustomerModel.deleteMany({})
    ]);

    // 3. Preparação dos dados
    const hashedPassword = await bcrypt.hash(env.INITIAL_ADMIN_PASSWORD, 10);

    const adminData: AdminCreateData = {
      name: 'Admin Master',
      email: env.INITIAL_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin' as IAdmin['role'],
      permissions: ['all']
    };

    const customerData: CustomerCreateData = {
      name: 'Nilton Cliente',
      email: 'cliente@teste.com',
      password: hashedPassword,
      role: 'customer' as ICustomer['role']
    };

    // 4. Inserção no Banco
    await AdminModel.create(adminData);
    await CustomerModel.create(customerData);

    logger.info("[SEED] Sucesso: Admin e Cliente padrão criados.");

  } catch (error: unknown) {
    // ✅ CORREÇÃO DO LOGGER: Objeto primeiro, mensagem depois
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      "[SEED_ERROR] Falha ao popular usuários"
    );
    process.exit(1);
  } finally {
    // 5. Encerramento limpo
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Executa o script
seedUsers();