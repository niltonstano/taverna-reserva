import axios from "axios";
import crypto from "crypto";

const API_URL = "http://localhost:3333/api/v1/checkout/process";
const PRODUCT_ID = "699e000df356232b2addee06";
const meuTokenAtual =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OWUwNDBlMTIwNTIzNDNhODhkZTY2NiIsImVtYWlsIjoibmlsdG9uQHRlc3RlLmNvbSIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjpbImFsbCJdLCJpc3MiOiJ0YXZlcm5hLXJlc2VydmEtYXBpIiwic3ViIjoiNjk5ZTA0MGUxMjA1MjM0M2E4OGRlNjY2IiwiaWF0IjoxNzcxOTYzNDk2LCJleHAiOjE3NzE5OTIyOTZ9.fm8h7cni6Of0cCCq22gQphjelAbUwMPOf5WVvyPh3fo";

async function run() {
  console.log("🍷 Taverna Reserva - Iniciando Stress Test (10 Requisições)...");

  const reqs = Array.from({ length: 10 }).map((_, i) => {
    return axios
      .post(
        API_URL,
        {
          address: "Rua da Taverna, 777",
          zipCode: "12345678",
          total: 199, // Cálculo: (1 unidade * 189.00) + 10.00 de frete
          shipping: {
            service: "SEDEX",
            price: 10,
            deadline: 2,
            company: "Taverna Log",
          },
          items: [{ productId: PRODUCT_ID, quantity: 1 }],
        },
        {
          headers: {
            Authorization: "Bearer " + meuTokenAtual,
            "idempotency-key": crypto.randomUUID(),
            "Content-Type": "application/json",
          },
        },
      )
      .catch((e) => e.response);
  });

  const results = await Promise.all(reqs);

  console.log("\n--- RELATÓRIO FINAL ---");
  results.forEach((r, i) => {
    if (r?.status === 201 || r?.status === 200) {
      console.log(`✅ Pedido ${i + 1}: PROCESSADO (Status ${r.status})`);
    } else if (r?.status === 400) {
      const motivo = JSON.stringify(r.data.message || r.data.errors || r.data);
      console.log(`❌ Pedido ${i + 1}: FALHOU (400) -> Motivo: ${motivo}`);
    } else {
      console.log(
        `❓ Pedido ${i + 1}: Status inesperado ${r?.status || "Erro de Rede"}`,
      );
    }
  });
}

run();
