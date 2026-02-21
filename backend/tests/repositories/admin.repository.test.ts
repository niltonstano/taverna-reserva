import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import { Types } from "mongoose";
import { AdminModel } from "../../src/models/admin.js";
import { CustomerModel } from "../../src/models/customer.model.js";
import { OrderModel } from "../../src/models/order.model.js";
import { ProductModel } from "../../src/models/product.model.js";
import { AdminRepository } from "../../src/repositories/admin.repository.js";
import {
  clearDatabase,
  setupMongoMemory,
  teardownMongoMemory,
} from "../helpers/mongo-memory.js";

describe("AdminRepository - Integração Total", () => {
  let adminRepository: AdminRepository;
  const fakeId = new Types.ObjectId().toString();

  beforeAll(async () => {
    await setupMongoMemory();
    adminRepository = new AdminRepository();
  });

  afterAll(async () => {
    await teardownMongoMemory();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe("🛡️ Gestão de Administradores", () => {
    it("deve criar um novo administrador (create)", async () => {
      const data = {
        name: "Administrador",
        email: "novo@test.com",
        password: "password123",
      };
      const created = await adminRepository.create(data);
      expect(created.email).toBe(data.email);
    });

    it("deve buscar por ID ocultando senha (findById)", async () => {
      const admin = await AdminModel.create({
        name: "Admin A",
        email: "a@a.com",
        password: "password123",
      });
      const found = await adminRepository.findById(admin._id.toString());
      expect(found?.password).toBeUndefined();
    });

    it("deve buscar por e-mail ocultando senha (findByEmail)", async () => {
      const email = "cobertura@test.com";
      await AdminModel.create({
        name: "Admin B",
        email,
        password: "password123",
      });
      const found = await adminRepository.findByEmail(email);
      expect(found?.email).toBe(email);
    });

    it("deve buscar por e-mail com senha (findByEmailWithPassword)", async () => {
      const email = "pass@test.com";
      await AdminModel.create({
        name: "Admin C",
        email,
        password: "hash_password",
      });
      const found = await adminRepository.findByEmailWithPassword(email);
      expect(found?.password).toBe("hash_password");
    });
  });

  describe("📦 Gestão de Pedidos", () => {
    it("deve listar todos os pedidos (findAllOrders)", async () => {
      const user = await CustomerModel.create({
        name: "Usuario Teste",
        email: "u@u.com",
        password: "password123",
      });
      await OrderModel.create({
        userId: user._id,
        customerEmail: user.email,
        idempotencyKey: "key-1",
        items: [],
        totalPriceCents: 1000,
        status: "pending",
        address: "Rua Teste, 123",
        zipCode: "12345-678",
        shipping: {
          service: "Sedex",
          company: "Correios",
          priceCents: 2000,
          deadline: 3,
        },
      });
      const orders = await adminRepository.findAllOrders();
      expect(orders.length).toBe(1);
    });
  });

  describe("🍷 Gestão de Inventário", () => {
    it("deve buscar por ID, listar e deletar produtos", async () => {
      const p = await ProductModel.create({
        name: "Vinho Teste Admin",
        price: 15000,
        stock: 20,
        category: "Vinho", // ✅ Categoria válida
        active: true,
      });

      const found = await adminRepository.findProductById(p._id.toString());
      expect(found).not.toBeNull();

      const products = await adminRepository.findAllProducts();
      expect(products.length).toBeGreaterThanOrEqual(1);

      const deleted = await adminRepository.deleteProduct(p._id.toString());
      expect(deleted).toBe(true);
    });
  });
});
