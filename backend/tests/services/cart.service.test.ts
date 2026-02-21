import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Types } from "mongoose";
import { CartService } from "../../src/services/cart.service.js";

describe("CartService - Unidade", () => {
  let cartService: CartService;

  // Mocks dos Repositórios (Isolamento total do Banco de Dados)
  const cartRepoMock: any = {
    findByUserId: jest.fn(),
    addItemAtomic: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
  };

  const productRepoMock: any = {
    findById: jest.fn(),
  };

  const MOCK_USER_ID = "507f1f77bcf86cd799439011";
  const MOCK_PRODUCT_ID = "507f1f77bcf86cd799439012";

  beforeEach(() => {
    jest.clearAllMocks();
    cartService = new CartService(cartRepoMock, productRepoMock);
  });

  it("✅ Deve calcular totais corretamente ao buscar carrinho", async () => {
    cartRepoMock.findByUserId.mockResolvedValue({
      _id: new Types.ObjectId(),
      userId: MOCK_USER_ID,
      items: [
        {
          productId: {
            _id: MOCK_PRODUCT_ID,
            name: "Item A",
            price: 50.5,
            stock: 10,
          },
          quantity: 2,
        },
      ],
      updatedAt: new Date(),
    });

    const result = await cartService.getCartByUserId(MOCK_USER_ID);

    expect(result.totalItems).toBe(2);
    expect(result.totalPrice).toBe("101.00"); // 50.5 * 2
    expect(result.items[0].productId.name).toBe("Item A");
  });

  it("❌ Deve estourar erro se tentar adicionar produto sem estoque", async () => {
    productRepoMock.findById.mockResolvedValue({
      _id: MOCK_PRODUCT_ID,
      stock: 2,
    });

    await expect(
      cartService.addItem(MOCK_USER_ID, MOCK_PRODUCT_ID, 5),
    ).rejects.toThrow("ESTOQUE_INSUFICIENTE");
  });

  it("🛡️ Deve validar formato de ObjectId antes de processar", async () => {
    await expect(
      cartService.getCartByUserId("id-invalido-123"),
    ).rejects.toThrow("ID_INVALIDO");
  });
});
