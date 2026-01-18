import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/admin.js';
import { CustomerModel } from '../models/customer.model.js';
import { IAdmin } from '../interfaces/admin.interface.js';
import { env } from '../config/env.js';

async function seed(): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI);

    // Reset total do banco
    await Promise.all([
      AdminModel.deleteMany({}),
      CustomerModel.deleteMany({})
    ]);

    // Usando a senha do seu .env validada pelo Zod
    const hashedPassword = await bcrypt.hash(env.INITIAL_ADMIN_PASSWORD, 10);

    // Tipagem Omit para ignorar os métodos internos do Mongoose que causavam erro
    const adminData: Omit<IAdmin, '_id' | 'createdAt' | 'updatedAt'> = {
      name: 'Admin Master',
      email: env.INITIAL_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      permissions: ['all']
    };

    const customerData = {
      name: 'Nilton Cliente',
      email: 'cliente@teste.com',
      password: hashedPassword,
      role: 'customer' as const
    };

    // Inserção direta
    await AdminModel.create(adminData);
    await CustomerModel.create(customerData);

    // Apenas um log de sucesso no final
    process.stdout.write('✅ Banco populado com sucesso.\n');

  } catch (error) {
    process.stderr.write(`❌ Erro no Seed: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();