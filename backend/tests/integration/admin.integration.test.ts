import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { buildApp } from '../../src/app.js'; 
import { setupMongoMemory, teardownMongoMemory } from '../helpers/mongo-memory.js';
import { AdminModel } from '../../src/models/admin.js';
import { FastifyInstance } from 'fastify'; 
import bcrypt from 'bcryptjs';

describe('🛠️ Integração: Painel Administrativo Completo', () => {
  let app: FastifyInstance;
  let adminToken: string;
  const BASE_URL = "/api/v1/admin"; 

  beforeAll(async () => {
    await setupMongoMemory();
    app = await buildApp(); 
    await app.ready();
  });

  beforeEach(async () => {
    await AdminModel.deleteMany({});
    
    // 1. Criamos o Admin com a Role correta para passar no middleware 'adminOnly'
    const hashedPassword = await bcrypt.hash("Senha@123456", 12);
    await AdminModel.create({ 
      name: "Admin Teste", 
      email: "admin@teste.com", 
      password: hashedPassword, 
      role: 'admin',
      permissions: ["all"]
    });

    // 2. Realizamos o login na rota correta de autenticação
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/admin/login",
      payload: { email: "admin@teste.com", password: "Senha@123456" }
    });
    
    const body = loginRes.json();
    
    if (!body.token) {
      throw new Error(`FALHA NO LOGIN DO TESTE: ${JSON.stringify(body)}`);
    }
    
    adminToken = body.token;
  });

  afterAll(async () => {
    if (app) await app.close();
    await teardownMongoMemory();
  });

  it('✅ deve retornar 200 e os dados do perfil administrativo', async () => {
    const res = await app.inject({
      method: "GET", 
      url: `${BASE_URL}/profile`,
      headers: { 
        // Enviando o token com o prefixo Bearer e case correto
        "authorization": `Bearer ${adminToken}` 
      }
    });

    // Se ainda der 401, o log abaixo vai nos mostrar o erro do middleware
    if (res.statusCode !== 200) {
      console.log("❌ Erro na requisição:", res.json());
    }

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe("admin@teste.com");
  });

  it('🛡️ deve bloquear acesso se o token estiver ausente', async () => {
    const res = await app.inject({
      method: "GET", 
      url: `${BASE_URL}/profile`
    });
    expect(res.statusCode).toBe(401);
  });
});