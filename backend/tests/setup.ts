import { jest, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { setupMongoMemory, teardownMongoMemory, clearDatabase } from "./helpers/mongo-memory.js";

/* BINGO: Adicionamos o Enum aqui para que o Jest 
   encontre ele ao carregar os testes de integração.
*/
const UserRole = {
  ADMIN: "admin",
  CUSTOMER: "customer"
};

// ✅ Usamos o mock instável para lidar com módulos ESM
jest.unstable_mockModule("../src/middlewares/authorization.js", () => ({
  UserRole,
  authenticate: async (req: any) => {
    // @ts-ignore: Evita erro de tipagem no req.user durante o teste
    req.user = {
      id: "65a12345678901234567890a", 
      role: "customer",
    };
  },
  verifyRole: () => async () => {},
  adminOnly: async () => {},
  customerOnly: async () => {},
  authorizeOwnership: async () => {},
  authorizeCart: async () => {}, 
}));

/* --- CICLO DE VIDA DOS TESTES --- */

beforeAll(async () => {
  // ✅ Garante que o servidor de memória suba antes dos testes
  await setupMongoMemory();
});

beforeEach(async () => {
  // ✅ Limpa as coleções para um ambiente isolado em cada teste
  await clearDatabase();
});

afterAll(async () => {
  // ✅ Fecha a conexão para não deixar processos pendentes
  await teardownMongoMemory();
});