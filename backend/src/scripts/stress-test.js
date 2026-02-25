import axios from "axios";
import crypto from "crypto";

const BASE_URL = "http://localhost:3333/api/v1";
const meuTokenAtual = "seu_token_aqui"; // Substitua pelo token real do seu usuário

async function dispararDezPedidosNoUltimo() {
  try {
    // 1️⃣ Pega a vitrine para identificar o último produto automaticamente
    const { data: response } = await axios.get(`${BASE_URL}/products`);
    const produtos = response.data;
    const ultimoProduto = produtos[produtos.length - 1];

    if (!ultimoProduto) {
      console.log("❌ Nenhum produto encontrado no banco.");
      return;
    }

    console.log("\n==========================================");
    console.log(`🎯 ALVO: ${ultimoProduto.name}`);
    console.log(`📊 ESTOQUE ATUAL: ${ultimoProduto.stock}`);
    console.log("🚀 DISPARANDO 10 PEDIDOS SIMULTÂNEOS...");
    console.log("==========================================\n");

    // 2️⃣ Cria o "tiro" de 10 pedidos ao mesmo tempo
    const pedidos = Array.from({ length: 10 }).map((_, i) => {
      return axios
        .post(
          `${BASE_URL}/checkout/process`,
          {
            address: "Rua do Stress Test, 100",
            zipCode: "01001000",
            total: ultimoProduto.price + 10, // Preço + 10 de frete
            shipping: {
              service: "SEDEX",
              price: 10,
              deadline: 1,
              company: "Taverna Log",
            },
            items: [
              {
                productId: ultimoProduto._id,
                quantity: 1,
                price: ultimoProduto.price,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${meuTokenAtual}`,
              "idempotency-key": crypto.randomUUID(), // Chave única para cada um dos 10 pedidos
              "Content-Type": "application/json",
            },
          },
        )
        .catch((e) => e.response);
    });

    // 3️⃣ Executa a corrida
    const resultados = await Promise.all(pedidos);

    // 4️⃣ Relatório Final
    let sucessos = 0;
    resultados.forEach((r, i) => {
      if (r?.status === 201 || r?.status === 200) {
        sucessos++;
        console.log(`✅ Pedido ${i + 1}: PROCESSADO`);
      } else {
        console.log(
          `❌ Pedido ${i + 1}: FALHOU (${r?.status}) -> ${r?.data?.message}`,
        );
      }
    });

    console.log("\n==========================================");
    console.log(`🏆 TOTAL DE PEDIDOS CONCLUÍDOS: ${sucessos}`);
    console.log(`📉 ESTOQUE FINAL ESPERADO: ${ultimoProduto.stock - sucessos}`);
    console.log("==========================================\n");
  } catch (error) {
    console.error("❌ Erro na operação:", error.message);
  }
}

dispararDezPedidosNoUltimo();
