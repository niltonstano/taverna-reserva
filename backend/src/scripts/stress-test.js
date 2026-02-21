import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

// Carrega as variáveis do seu arquivo .env
dotenv.config();

const API_URL =
  process.env.API_URL || "http://localhost:3333/api/v1/checkout/process";
const TOKEN = process.env.ADMIN_TOKEN;
const PRODUCT_ID = process.env.TEST_PRODUCT_ID;

if (!TOKEN || !PRODUCT_ID) {
  console.error(
    "❌ ERRO: Defina ADMIN_TOKEN e TEST_PRODUCT_ID no seu arquivo .env",
  );
  process.exit(1);
}

const MOCK_UUID = crypto.randomUUID();

const payload = {
  address: "Rua da Taverna, 777",
  zipCode: "12345678",
  total: 199,
  shipping: {
    service: "SEDEX",
    price: 10,
    deadline: 2,
    company: "Taverna Log",
  },
  items: [
    {
      productId: PRODUCT_ID,
      quantity: 1,
    },
  ],
};

async function run() {
  console.log(`🚀 Stress Test na Taverna Reserva (Security Mode)`);
  console.log(`🔑 Idempotency-Key: ${MOCK_UUID}\n`);

  const reqs = Array.from({ length: 10 }).map((_, i) =>
    axios
      .post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "idempotency-key": MOCK_UUID,
          "Content-Type": "application/json",
        },
      })
      .catch((e) => {
        if (i === 0) console.log("⚠️ Detalhes Req 1:", e.response?.data);
        return e.response;
      }),
  );

  const results = await Promise.all(reqs);

  console.log("📊 RESULTADOS:");
  results.forEach((r, i) => {
    const status = r?.status;
    const icons = {
      201: "✅ SUCESSO",
      409: "🛡️ BLOQUEADO (Idempotência)",
      400: "⚠️ ERRO (Validação/Negócio)",
    };
    console.log(`Requisição ${i + 1}: ${icons[status] || "❌ Erro " + status}`);
  });
}

run();
