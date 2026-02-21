import { afterAll, beforeAll, beforeEach, jest } from "@jest/globals";
import {
  clearDatabase,
  setupMongoMemory,
  teardownMongoMemory,
} from "./helpers/mongo-memory.js";

/* --- 1. CONFIGURAÇÃO DE AMBIENTE --- 
   Aqui usamos MONGO_URI para bater com o seu docker-compose e seu env.ts
*/
process.env.NODE_ENV = "test";
process.env.PORT = "3333";

// O banco de memória do teste rodará localmente, ignorando o container do Docker
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/taverna_test";
process.env.JWT_SECRET = "secret_para_teste_da_taverna_123";
process.env.MELHOR_ENVIO_TOKEN = "token_fake_melhor_envio";
process.env.MELHOR_ENVIO_URL = "https://sandbox.melhorenvio.com.br";
process.env.CEP_ORIGEM = "01001000";

/* --- 2. MOCK DO PROCESS.EXIT --- */
jest.spyOn(process, "exit").mockImplementation((code) => {
  throw new Error(
    `🛑 Validação de ENV falhou! Verifique o log. Código: ${code}`,
  );
});

/* --- 3. MOCK DE AUTORIZAÇÃO (ESM) --- */
const UserRole = {
  ADMIN: "admin",
  CUSTOMER: "customer",
};

jest.unstable_mockModule("../src/middlewares/authorization.js", () => ({
  UserRole,
  authenticate: async (req: any, _res: any, next: any) => {
    req.user = { id: "65a12345678901234567890a", role: "customer" };
    if (next) next();
  },
  verifyRole: () => async (_req: any, _res: any, next: any) => {
    if (next) next();
  },
  adminOnly: async (_req: any, _res: any, next: any) => {
    if (next) next();
  },
  customerOnly: async (_req: any, _res: any, next: any) => {
    if (next) next();
  },
  authorizeOwnership: async (_req: any, _res: any, next: any) => {
    if (next) next();
  },
  authorizeCart: async (_req: any, _res: any, next: any) => {
    if (next) next();
  },
}));

/* --- 4. CICLO DE VIDA DOS TESTES --- */
beforeAll(async () => {
  // O setupMongoMemory precisa configurar um ReplicaSet para os testes de checkout!
  await setupMongoMemory();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await teardownMongoMemory();
});
