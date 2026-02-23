import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { AdminModel } from "../models/admin.js";
import { CustomerModel } from "../models/customer.model.js";
import { ProductModel } from "../models/product.model.js";

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
    console.log("🏰 TAVERNA RESERVA - DATA SEED");
    console.log("==========================================");

    const uri =
      process.env.MONGO_URI || "mongodb://mongodb:27017/taverna?replicaSet=rs0";
    await mongoose.connect(uri);
    console.log("📡 Conectado ao MongoDB...");

    console.log("🧹 Limpando coleções...");
    await Promise.all([
      AdminModel.deleteMany({}),
      CustomerModel.deleteMany({}),
      ProductModel.deleteMany({}),
    ]);

    console.log("👤 Criando Admin...");
    const hashedPassword = await bcrypt.hash("sua_senha_forte", 10);
    await AdminModel.create({
      name: "Master Admin",
      email: "admin@teste.com",
      password: hashedPassword,
      role: "admin",
      permissions: ["all"],
    });

    console.log(`🍷 Inserindo ${vinhosBase.length} produtos...`);

    const vinhosFinal = vinhosBase.map((v) => ({
      name: v.name,
      price: v.price,
      // AQUI ESTÁ A CHAVE:
      category: "Vinho", // Campo obrigatório conforme seu enum
      type: v.type, // "Tinto" ou "Branco" vai aqui no type
      imageUrl: v.img,
      stock: 50,
      active: true,
      description: "Vinho selecionado pela Taverna Reserva.",
      weight: 1.5,
      dimensions: { width: 12, height: 33, length: 12 },
      safra: "2021",
      uva: "Seleção Especial",
      origem: "Importado",
      pontuacao: 90,
    }));

    await ProductModel.insertMany(vinhosFinal);

    console.log("\n✅ BANCO POPULADO COM SUCESSO!");
    console.log("👉 Admin: admin@teste.com | Senha: Admin@123");
    console.log("==========================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ ERRO NO SEED:");
    console.error(err.message);
    process.exit(1);
  }
}

seed();
