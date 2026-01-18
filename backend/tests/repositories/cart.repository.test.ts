// ✅ IMPORTAÇÃO NECESSÁRIA PARA ESM + TYPESCRIPT
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

import { CartRepository } from '../../src/repositories/cart.repository.js';
import { connectMockDB, disconnectMockDB, clearMockDB } from '../helpers/mongo-memory.js';
import { Types } from 'mongoose';

describe("CartRepository - Testes de Integração com Banco Real (In-Memory)", () => {
  let cartRepository: CartRepository;

  beforeAll(async () => await connectMockDB());
  afterAll(async () => await disconnectMockDB());
  
  beforeEach(async () => {
    await clearMockDB();
    cartRepository = new CartRepository();
  });

  const userId = new Types.ObjectId().toHexString();
  const productId = new Types.ObjectId().toHexString();

  describe("updateItemAtomatic", () => {
    it("deve criar um novo carrinho (upsert) se o usuário não possuir um", async () => {
      const quantity = 2;
      
      const cart = await cartRepository.updateItemAtomatic(userId, productId, quantity);

      expect(cart).toBeDefined();
      expect(cart?.items).toHaveLength(1);
      // Usamos cast ou toString() para garantir comparação de strings
      expect(cart?.items[0].productId.toString()).toBe(productId);
      expect(cart?.items[0].quantity).toBe(2);
    });

    it("deve incrementar a quantidade ($inc) se o produto já existir no carrinho", async () => {
      await cartRepository.updateItemAtomatic(userId, productId, 1);
      const updatedCart = await cartRepository.updateItemAtomatic(userId, productId, 3);

      expect(updatedCart?.items).toHaveLength(1); 
      expect(updatedCart?.items[0].quantity).toBe(4); // 1 + 3 = 4
    });

    it("deve adicionar um novo item ($push) se o carrinho existir mas o produto for novo", async () => {
      const productId2 = new Types.ObjectId().toHexString();
      
      await cartRepository.updateItemAtomatic(userId, productId, 1);
      const updatedCart = await cartRepository.updateItemAtomatic(userId, productId2, 5);

      expect(updatedCart?.items).toHaveLength(2);
      expect(updatedCart?.items.find(i => i.productId.toString() === productId2)?.quantity).toBe(5);
    });
  });

  describe("deleteByUserId", () => {
    it("deve retornar true ao deletar um carrinho existente", async () => {
      await cartRepository.updateItemAtomatic(userId, productId, 1);
      
      const result = await cartRepository.deleteByUserId(userId);
      const findAgain = await cartRepository.findByUserId(userId);

      expect(result).toBe(true);
      expect(findAgain).toBeNull();
    });

    it("deve retornar false ao tentar deletar um carrinho que não existe", async () => {
      const result = await cartRepository.deleteByUserId(new Types.ObjectId().toHexString());
      expect(result).toBe(false);
    });
  });
});