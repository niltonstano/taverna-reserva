// tests/integration/payment.integration.test.ts
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import mongoose from "mongoose";
import { OrderModel } from "../../src/models/order.model.js";
import { PaymentService } from "../../src/services/payment.service.js";
import { BadRequestError, NotFoundError } from "../../src/utils/errors.js";

// Mock do modelo para evitar chamadas reais ao banco
jest.mock("../../src/models/order.model.js");

describe("PaymentService - Unit Tests", () => {
  let paymentService: PaymentService;
  let productRepoMock: any;
  let whatsappServiceMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock global da sessão do Mongoose (Necessário para as Transações ACID)
    (mongoose.startSession as any) = jest.fn().mockImplementation(() =>
      Promise.resolve({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      }),
    );

    productRepoMock = {
      updateStock: jest.fn().mockImplementation(() => Promise.resolve()),
    };

    whatsappServiceMock = {
      generatePix: jest.fn(),
    };

    paymentService = new PaymentService(productRepoMock, whatsappServiceMock);
  });

  // --- 1. SUCESSO ---
  it("deve confirmar um pagamento e atualizar o status para 'paid'", async () => {
    const saveMock = jest.fn().mockImplementation(() => Promise.resolve());
    const fakeOrder = {
      _id: "order_123",
      status: "pending",
      save: saveMock,
      items: [],
    };

    const sessionSpy = jest
      .fn()
      .mockImplementation(() => Promise.resolve(fakeOrder as any));
    jest
      .spyOn(OrderModel, "findById")
      .mockReturnValue({ session: sessionSpy } as any);

    const result = await paymentService.updateStatus("order_123", "paid");
    expect(result.status).toBe("paid");
    expect(saveMock).toHaveBeenCalled();
  });

  // --- 2. NOT FOUND ---
  it("deve lançar erro se o pedido não existir", async () => {
    const sessionSpy = jest
      .fn()
      .mockImplementation(() => Promise.resolve(null as any));
    jest
      .spyOn(OrderModel, "findById")
      .mockReturnValue({ session: sessionSpy } as any);

    await expect(
      paymentService.updateStatus("invalid", "paid"),
    ).rejects.toThrow(NotFoundError);
  });

  // --- 3. CANCELAMENTO E ESTORNO ---
  it("deve estornar o estoque quando o status for 'canceled'", async () => {
    const fakeOrder = {
      _id: "order_123",
      status: "pending",
      items: [
        { productId: new mongoose.Types.ObjectId(), quantity: 2 },
        { productId: new mongoose.Types.ObjectId(), quantity: 5 },
      ],
      save: jest.fn().mockImplementation(() => Promise.resolve()),
    };

    jest.spyOn(OrderModel, "findById").mockReturnValue({
      session: jest
        .fn()
        .mockImplementation(() => Promise.resolve(fakeOrder as any)),
    } as any);

    await paymentService.updateStatus("order_123", "canceled");
    expect(productRepoMock.updateStock).toHaveBeenCalledTimes(2);
    expect(productRepoMock.updateStock).toHaveBeenCalledWith(
      expect.any(String),
      -2,
    );
  });

  // --- 4. VALIDAÇÃO DE STATUS ---
  it("não deve permitir alterar status de um pedido que não esteja 'pending'", async () => {
    const paidOrder = { _id: "order_123", status: "paid", save: jest.fn() };
    jest.spyOn(OrderModel, "findById").mockReturnValue({
      session: jest
        .fn()
        .mockImplementation(() => Promise.resolve(paidOrder as any)),
    } as any);

    await expect(
      paymentService.updateStatus("order_123", "canceled"),
    ).rejects.toThrow(BadRequestError);
  });

  // --- 5. ROLLBACK (ERRO DB) ---
  it("deve realizar abortTransaction se houver erro ao salvar o pedido", async () => {
    const sessionMock = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    (mongoose.startSession as any).mockResolvedValue(sessionMock);

    const fakeOrder = {
      _id: "order_123",
      status: "pending",
      save: jest
        .fn()
        .mockImplementation(() => Promise.reject(new Error("Erro DB"))),
    };

    jest.spyOn(OrderModel, "findById").mockReturnValue({
      session: jest
        .fn()
        .mockImplementation(() => Promise.resolve(fakeOrder as any)),
    } as any);

    await expect(
      paymentService.updateStatus("order_123", "paid"),
    ).rejects.toThrow("Erro DB");
    expect(sessionMock.abortTransaction).toHaveBeenCalled();
  });

  // --- 6. ROLLBACK (ERRO ESTOQUE) ---
  it("deve realizar rollback se o estorno de estoque falhar", async () => {
    const sessionMock = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    (mongoose.startSession as any).mockResolvedValue(sessionMock);

    const fakeOrder = {
      _id: "order_123",
      status: "pending",
      items: [{ productId: "p1", quantity: 1 }],
      save: jest.fn().mockImplementation(() => Promise.resolve(true)),
    };
    jest.spyOn(OrderModel, "findById").mockReturnValue({
      session: jest
        .fn()
        .mockImplementation(() => Promise.resolve(fakeOrder as any)),
    } as any);

    productRepoMock.updateStock.mockImplementation(() =>
      Promise.reject(new Error("Erro Estoque")),
    );

    await expect(
      paymentService.updateStatus("order_123", "canceled"),
    ).rejects.toThrow("Erro Estoque");
    expect(sessionMock.abortTransaction).toHaveBeenCalled();
  });

  // --- 7. AUDITORIA / METADADOS ---
  it("deve salvar o transactionId nos metadados do pedido ao pagar", async () => {
    const fakeOrder = {
      _id: "order_123",
      status: "pending",
      metadata: {},
      save: jest.fn().mockImplementation(() => Promise.resolve(true)),
      items: [],
    };
    jest.spyOn(OrderModel, "findById").mockReturnValue({
      session: jest
        .fn()
        .mockImplementation(() => Promise.resolve(fakeOrder as any)),
    } as any);

    await paymentService.updateStatus("order_123", "paid", "TID_123");
    expect(fakeOrder.metadata).toMatchObject({ transactionId: "TID_123" });
  });

  // --- 8. IDEMPOTÊNCIA ---
  it("deve garantir idempotência: lançar erro se atualizar para o mesmo status", async () => {
    const alreadyPaidOrder = {
      _id: "order_123",
      status: "paid",
      save: jest.fn(),
    };
    jest.spyOn(OrderModel, "findById").mockReturnValue({
      session: jest
        .fn()
        .mockImplementation(() => Promise.resolve(alreadyPaidOrder as any)),
    } as any);

    await expect(
      paymentService.updateStatus("order_123", "paid"),
    ).rejects.toThrow(BadRequestError);
    expect(alreadyPaidOrder.save).not.toHaveBeenCalled();
  });

  // --- 9. MÚLTIPLOS ITENS ---
  it("deve garantir que múltiplos itens no pedido tenham o estoque estornado corretamente", async () => {
    const fakeOrder = {
      _id: "order_123",
      status: "pending",
      items: Array.from({ length: 10 }).map((_, i) => ({
        productId: `p_${i}`,
        quantity: 1,
      })),
      save: jest.fn().mockImplementation(() => Promise.resolve(true)),
    };

    jest.spyOn(OrderModel, "findById").mockReturnValue({
      session: jest
        .fn()
        .mockImplementation(() => Promise.resolve(fakeOrder as any)),
    } as any);

    await paymentService.updateStatus("order_123", "canceled");
    expect(productRepoMock.updateStock).toHaveBeenCalledTimes(10);
  });

  // --- 10. SEGURANÇA DE TRANSAÇÃO ---
  it("não deve chamar commitTransaction se houver qualquer erro no processo", async () => {
    const sessionMock = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    (mongoose.startSession as any).mockResolvedValue(sessionMock);

    jest.spyOn(OrderModel, "findById").mockReturnValue({
      session: jest.fn().mockImplementation(() => Promise.resolve(null as any)),
    } as any);

    try {
      await paymentService.updateStatus("order_123", "paid");
    } catch (e) {
      // Erro esperado para validar o estado da sessão
    }

    expect(sessionMock.commitTransaction).not.toHaveBeenCalled();
    expect(sessionMock.abortTransaction).toHaveBeenCalled();
  });
});
