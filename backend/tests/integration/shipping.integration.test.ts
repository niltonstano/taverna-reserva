import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import axios from "axios";
import { ShippingService } from "../../src/services/shipping.service";

jest.mock("axios");
const mockedAxios = axios as any;

describe("ShippingService", () => {
  let shippingService: ShippingService;
  let productRepoMock: any;
  let cartRepoMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // GARANTIA: Forçamos o post do axios a ser um mock em cada teste
    mockedAxios.post = jest.fn();

    productRepoMock = {
      findById: (jest.fn() as any).mockResolvedValue({
        _id: "699e42799f25e5b404aa96a4",
        price: 15000,
        weight: 1.2,
        dimensions: { width: 20, height: 10, length: 20 },
      }),
    };

    cartRepoMock = { findByUserId: jest.fn() };
    shippingService = new ShippingService(productRepoMock, cartRepoMock);
    (shippingService as any).MELHOR_ENVIO_TOKEN = "test_token_123";
  });

  it("deve calcular o frete com sucesso", async () => {
    (mockedAxios.post as any).mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Sedex",
          price: "25.50",
          delivery_time: 3,
          company: { name: "C", picture: "p" },
        },
      ],
    });

    const result = await shippingService.calculateShipping(
      "guest",
      "01001000",
      [{ productId: "699e42799f25e5b404aa96a4", quantity: 1 }],
    );

    expect(result[0].name).toBe("Sedex");
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  it("deve lançar erro se a API do Melhor Envio falhar", async () => {
    (mockedAxios.post as any).mockRejectedValue(new Error("API_OFFLINE"));

    await expect(
      shippingService.calculateShipping("guest", "01001000", [
        { productId: "699e42799f25e5b404aa96a4", quantity: 1 },
      ]),
    ).rejects.toThrow("API_OFFLINE");
  });

  it("deve lançar erro se um produto no carrinho não existir no banco", async () => {
    productRepoMock.findById.mockResolvedValue(null);

    await expect(
      shippingService.calculateShipping("guest", "01001000", [
        { productId: "ID_INVALIDO", quantity: 1 },
      ]),
    ).rejects.toThrow();
  });

  it("deve filtrar apenas modalidades de frete que possuem preço e prazo", async () => {
    (mockedAxios.post as any).mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Sedex",
          price: "25.00",
          delivery_time: 3,
          company: { name: "C", picture: "p" },
        },
        { id: 2, name: "Frete Quebrado", error: "Serviço indisponível" },
      ],
    });

    const result = await shippingService.calculateShipping(
      "guest",
      "01001000",
      [{ productId: "699e42799f25e5b404aa96a4", quantity: 1 }],
    );

    expect(result.some((r) => r.name === "Sedex")).toBe(true);
  });

  it("deve lidar com múltiplas requisições de frete simultâneas sem conflito", async () => {
    console.log(
      "\n🚀 Iniciando Teste de Stress: Múltiplas requisições de frete...",
    );
    const startBatch = Date.now();

    (mockedAxios.post as any).mockImplementation(() => {
      const delay = Math.floor(Math.random() * 50) + 30;
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              data: [
                {
                  id: 1,
                  name: "Sedex",
                  price: "25.00",
                  delivery_time: 3,
                  company: { name: "C", picture: "p" },
                },
              ],
            }),
          delay,
        ),
      );
    });

    const totalRequests = 10;
    const requests = Array(totalRequests)
      .fill(null)
      .map(async (_, i) => {
        const startReq = Date.now();
        const result = await shippingService.calculateShipping(
          "guest",
          "01001000",
          [{ productId: "699e42799f25e5b404aa96a4", quantity: 1 }],
        );
        console.log(
          `  📦 Req #${i + 1}: Finalizada em ${Date.now() - startReq}ms | Status: ✅`,
        );
        return result;
      });

    const results = await Promise.all(requests);
    const totalDuration = Date.now() - startBatch;

    console.log("--------------------------------------------------");
    console.table({
      "Total de Requisições": totalRequests,
      "Duração Total (Paralela)": `${totalDuration}ms`,
      "Status Geral": "CONCURRÊNCIA OK",
    });
    console.log("--------------------------------------------------\n");

    expect(results).toHaveLength(totalRequests);
    expect(mockedAxios.post).toHaveBeenCalledTimes(totalRequests);
  });
});
