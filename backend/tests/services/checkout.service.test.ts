import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Connection, Types } from 'mongoose';
import { CheckoutService } from '../../src/services/checkout.service.js';
import { OrderRepository } from '../../src/repositories/order.repository.js';
import { CartRepository } from '../../src/repositories/cart.repository.js';
import { ProductRepository } from '../../src/repositories/product.repository.js';
import { ProductModel } from '../../src/models/product.model.js';
import { CartModel } from '../../src/models/cart.model.js';
import { OrderModel } from '../../src/models/order.model.js';
import { setupMongoMemory, teardownMongoMemory, getMongooseConnection } from '../helpers/mongo-memory.js';

describe('CheckoutService Integration Test', () => {
  let connection: Connection;
  let checkoutService: CheckoutService;
  let userId: string;

  beforeAll(async () => {
    await setupMongoMemory();
    connection = getMongooseConnection();
    const orderRepo = new OrderRepository();
    const cartRepo = new CartRepository();
    const productRepo = new ProductRepository();
    checkoutService = new CheckoutService(orderRepo, cartRepo, productRepo, connection);
  });

  afterAll(async () => await teardownMongoMemory());

  beforeEach(async () => {
    userId = new Types.ObjectId().toHexString();
    await ProductModel.deleteMany({});
    await CartModel.deleteMany({});
    await OrderModel.deleteMany({});
  });

  it('✅ Deve finalizar o checkout com sucesso (Fluxo Completo)', async () => {
    const product = await ProductModel.create({
      name: 'Teclado Mecânico',
      price: 500,
      stock: 10,
      active: true,
      category: 'informatica' // ✅ Corrigido
    });

    await CartModel.create({
      userId: new Types.ObjectId(userId),
      items: [{ productId: product._id, quantity: 2 }]
    });

    const order = await checkoutService.execute(userId, 'checkout-test-123');

    expect(order).toBeDefined();
    expect(order.totalPrice).toBe(1000);
    const updatedProduct = await ProductModel.findById(product._id);
    expect(updatedProduct?.stock).toBe(8);
  });

  it('🛡️ Deve ativar idempotência se chamado duas vezes com a mesma chave', async () => {
    const product = await ProductModel.create({ 
      name: 'Mouse', 
      price: 100, 
      stock: 5, 
      active: true,
      category: 'informatica' // ✅ Corrigido
    });
    
    await CartModel.create({ userId: new Types.ObjectId(userId), items: [{ productId: product._id, quantity: 1 }] });
    const key = 'same-key';

    const order1 = await checkoutService.execute(userId, key);
    const order2 = await checkoutService.execute(userId, key);

    expect(order1._id.toString()).toBe(order2._id.toString());
    const updatedProduct = await ProductModel.findById(product._id);
    expect(updatedProduct?.stock).toBe(4);
  });
});