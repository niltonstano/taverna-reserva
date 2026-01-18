import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Types } from 'mongoose'; // Adicionado para lidar com ObjectIds
import { AdminRepository } from '../../src/repositories/admin.repository.js';
import { AdminModel } from '../../src/models/admin.js';
import { ProductModel } from '../../src/models/product.model.js';
import { CustomerModel } from '../../src/models/customer.model.js';
import { OrderModel } from '../../src/models/order.model.js';
import { setupMongoMemory, teardownMongoMemory, clearDatabase } from '../helpers/mongo-memory.js';

describe("AdminRepository - Testes de Integração", () => {
  let adminRepository: AdminRepository;

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

  it("deve criar um novo administrador através do repositório", async () => {
      const adminData = { 
        name: "Novo Admin", 
        email: "novo@admin.com", 
        password: "hash" 
      };
      // Aqui chamamos o método do repositório (Linha 22)
      const created = await adminRepository.create(adminData);
      expect(created.name).toBe("Novo Admin");
    });

    it("deve listar todos os produtos cadastrados (findAllProducts)", async () => {
      await ProductModel.create({ 
        name: "Produto X", price: 10, stock: 5, category: "Geral" 
      });
      // Aqui chamamos o findAllProducts (Linha 57)
      const products = await adminRepository.findAllProducts();
      expect(products.length).toBeGreaterThan(0);
    });

  describe("Gestão de Administradores", () => {
    it("deve buscar um admin por ID (sem senha)", async () => {
      const admin = await AdminModel.create({ 
        name: "Admin ID", email: "id@admin.com", password: "123" 
      });

      const found = await adminRepository.findById(admin._id.toString());
      expect(found?.name).toBe("Admin ID");
      expect(found?.toObject()).not.toHaveProperty('password');
    });

    it("deve criar e buscar um admin por e-mail (sem senha)", async () => {
      const email = "admin@teste.com";
      await AdminModel.create({ name: "Admin Teste", email, password: "hash" });

      const admin = await adminRepository.findByEmail(email);
      expect(admin?.email).toBe(email);
      expect(admin?.toObject()).not.toHaveProperty('password');
    });

    it("deve buscar admin com senha para fins de login", async () => {
      const email = "login@teste.com";
      await AdminModel.create({ name: "Login", email, password: "secret" });

      const admin = await adminRepository.findByEmailWithPassword(email);
      expect(admin?.password).toBe("secret");
    });
  });

  describe("Gestão de Pedidos (Orders)", () => {
    it("deve listar pedidos populando dados do usuário", async () => {
      const user = await CustomerModel.create({ 
        name: "Comprador", 
        email: "compra@teste.com", 
        password: "123" 
      });

      // ✅ Preenchendo todos os campos que o seu Model exige
      await OrderModel.create({
        userId: user._id,
        items: [{ 
          productId: new Types.ObjectId(), 
          name: "Produto Teste", // Exigido pelo seu Schema
          quantity: 1, 
          price: 10,
          subtotal: 10  // Exigido pelo seu Schema
        }],
        totalPrice: 150,     // O erro indicou que o campo é 'totalPrice'
        idempotencyKey: "test-key-1", // Exigido pelo seu Schema
        status: "pending",
        shippingAddress: "Rua X",
        paymentMethod: "pix"
      });

      const orders = await adminRepository.findAllOrders();
      expect(orders).toHaveLength(1);
      // Validando o populate
      expect((orders[0].userId as any).name).toBe("Comprador");
    });

    it("deve atualizar o status de um pedido", async () => {
      const order = await OrderModel.create({
        userId: new Types.ObjectId(),
        items: [{ 
          productId: new Types.ObjectId(), 
          name: "Item", 
          quantity: 1, 
          price: 50, 
          subtotal: 50 
        }],
        totalPrice: 50,
        idempotencyKey: "test-key-2",
        status: "pending",
        shippingAddress: "Rua Y",
        paymentMethod: "card"
      });

      const updated = await adminRepository.updateOrderStatus(order._id.toString(), "shipped");
      expect(updated?.status).toBe("shipped");
    });
  });

  describe("Gestão de Inventário e Clientes", () => {
    it("deve listar todos os usuários omitindo senhas", async () => {
      await CustomerModel.create({ name: "U1", email: "u1@t.com", password: "p1" });
      const users = await adminRepository.findAllUsers();
      expect(users[0].toObject()).not.toHaveProperty('password');
    });

    it("deve excluir um cliente e retornar true", async () => {
      const customer = await CustomerModel.create({ name: "Del", email: "d@u.com", password: "1" });
      const deleted = await adminRepository.deleteUser(customer._id.toString());
      expect(deleted).toBe(true);
    });

    it("deve buscar um produto específico por ID", async () => {
      const prod = await ProductModel.create({ 
        name: "Lápis", price: 2, stock: 10, category: "papel" 
      });
      const found = await adminRepository.findProductById(prod._id.toString());
      expect(found?.name).toBe("Lápis");
    });

    it("deve retornar false ao tentar excluir produto inexistente", async () => {
      const result = await adminRepository.deleteProduct(new Types.ObjectId().toString());
      expect(result).toBe(false);
    });
  });
});