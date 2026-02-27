import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import { AdminModel } from "../models/admin.js";
import { ProductModel } from "../models/product.model.js";

// 1. Configuração do .env usando o caminho absoluto
dotenv.config();

const vinhosBase = [
  {
    name: "Melini Chianti Riserva",
    price: 189,
    img: "/vinhos/melini-chianti.webp",
    type: "Tinto",
  },
  {
    name: "Château Teyssier Grand Cru",
    price: 890,
    img: "/vinhos/chateau-teyssier.webp",
    type: "Tinto",
  },
  {
    name: "Cono Sur Reserva Especial",
    price: 198,
    img: "/vinhos/cono-sur.webp",
    type: "Branco",
  },
  {
    name: "Alta Pinot Grigio",
    price: 145,
    img: "/vinhos/alta-pinot-gridio.webp",
    type: "Branco",
  },
  {
    name: "Bourgogne Pinot Noir",
    price: 340,
    img: "/vinhos/bourgogne.webp",
    type: "Tinto",
  },
  {
    name: "Château Les Ancres",
    price: 210,
    img: "/vinhos/chateau-les-ancres.webp",
    type: "Tinto",
  },
  {
    name: "Don David Reserva",
    price: 165,
    img: "/vinhos/don-david.webp",
    type: "Tinto",
  },
  {
    name: "Limestone Coast Chardonnay",
    price: 178,
    img: "/vinhos/limestone-coast.webp",
    type: "Branco",
  },
  {
    name: "Montegras Reserva Especial",
    price: 155,
    img: "/vinhos/montegras.webp",
    type: "Tinto",
  },
  {
    name: "Rioja Reserva Especial",
    price: 295,
    img: "/vinhos/rioja.webp",
    type: "Tinto",
  },
  {
    name: "Vinarija Perak Especial",
    price: 220,
    img: "/vinhos/vinarija-perak-espacial.webp",
    type: "Branco",
  },
  {
    name: "Three of Wine",
    price: 232,
    img: "/vinhos/three-of-wine.webp",
    type: "Tinto",
  },
];

async function seed() {
  try {
    console.log("\n==========================================");
    console.log("🏰 TAVERNA RESERVA - DATA SEED (MODO SEGURO)");
    console.log("==========================================");

    // 2. BUSCANDO TUDO DO .ENV (Inclusive o Nome do Admin)
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    const adminName = process.env.INITIAL_ADMIN_NAME || "Admin"; // Se não houver nome no .env, usa "Admin"

    if (!adminEmail || !adminPassword) {
      console.error("\n❌ ERRO DE CONFIGURAÇÃO:");
      console.error(
        "INITIAL_ADMIN_EMAIL ou INITIAL_ADMIN_PASSWORD ausentes no .env",
      );
      process.exit(1);
    }

    const uri =
      process.env.MONGO_URI ||
      "mongodb://mongodb:27017/taverna?replicaSet=rs0&directConnection=true";

    await mongoose.connect(uri);
    console.log("📡 Conectado ao MongoDB...");

    // 4. Sincronização do Admin (NADA FIXO NO CÓDIGO)
    console.log(`👤 Sincronizando Admin: ${adminEmail}...`);
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await AdminModel.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          name: adminName, // Agora vem da variável!
          password: hashedPassword,
          role: "admin",
          permissions: ["all"],
        },
      },
      { upsert: true, new: true },
    );

    // 5. Sincronização dos Produtos
    console.log(`🍷 Sincronizando ${vinhosBase.length} produtos...`);
    for (const v of vinhosBase) {
      await ProductModel.findOneAndUpdate(
        { name: v.name },
        {
          $setOnInsert: {
            category: "Vinho",
            active: true,
            description: "Vinho selecionado pela Taverna Reserva.",
            weight: 1.5,
            dimensions: { width: 12, height: 33, length: 12 },
            safra: "2021",
            uva: "Seleção Especial",
            origem: "Importado",
            pontuacao: 90,
          },
          $set: {
            price: v.price,
            type: v.type,
            imageUrl: v.img,
            stock: 100,
          },
        },
        { upsert: true },
      );
    }

    console.log("\n✅ BANCO SINCRONIZADO COM SUCESSO!");
    console.log("------------------------------------------");
    console.log(`📧 Admin: ${adminEmail}`);
    console.log(`👤 Nome: ${adminName}`);
    console.log("==========================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ ERRO FATAL NO SEED:", err.message);
    process.exit(1);
  }
}

seed();
