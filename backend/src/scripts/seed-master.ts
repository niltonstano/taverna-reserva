import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { AdminModel } from "../models/admin.js";
import { CustomerModel } from "../models/customer.model.js";
import { ProductModel } from "../models/product.model.js";

const vinhosReais = [
  {
    name: "Melini Chianti Riserva",
    safra: "2021",
    origem: "Toscana, Itália",
    price: 189.0,
    image_url: "/vinhos/melini-chianti.webp",
    uva: "Sangiovese",
    category: "Tintos",
    description: "Um clássico da Toscana com notas de cereja madura.",
    pontuacao: 92,
    stock: 50,
    active: true,
  },
  {
    name: "Château Teyssier Grand Cru",
    safra: "2018",
    origem: "Bordeaux, França",
    price: 890.0,
    image_url: "/vinhos/chateau-teyssier.webp",
    uva: "Merlot",
    category: "Tintos",
    description: "Elegância francesa com taninos sedosos.",
    pontuacao: 96,
    emOferta: true,
    stock: 25,
    active: true,
  },
  {
    name: "Cono Sur Reserva Especial",
    safra: "2021",
    origem: "Casablanca, Chile",
    price: 198.0,
    image_url: "/vinhos/cono-sur.webp",
    uva: "Chardonnay",
    category: "Brancos",
    description: "Frescor cítrico vibrante e mineralidade.",
    pontuacao: 90,
    emOferta: true,
    stock: 40,
    active: true,
  },
  {
    name: "Alta Pinot Grigio",
    safra: "2022",
    origem: "Friuli, Itália",
    price: 145.0,
    image_url: "/vinhos/alta-pinot-gridio.webp",
    uva: "Pinot Grigio",
    category: "Brancos",
    description: "Leve, refrescante com notas de pera e maçã verde.",
    pontuacao: 88,
    stock: 60,
    active: true,
  },
  {
    name: "Pinot Grigio delle Venezie",
    safra: "2022",
    origem: "Veneza, Itália",
    price: 135.0,
    image_url: "/vinhos/pinot-grigio.webp",
    uva: "Pinot Grigio",
    category: "Brancos",
    description: "Vinho versátil e equilibrado, ideal para frutos do mar.",
    pontuacao: 87,
    stock: 45,
    active: true,
  },
  {
    name: "Bourgogne Pinot Noir",
    safra: "2020",
    origem: "Borgonha, França",
    price: 340.0,
    image_url: "/vinhos/bourgogne.webp",
    uva: "Pinot Noir",
    category: "Tintos",
    description: "Frutas vermelhas frescas e grande complexidade.",
    pontuacao: 93,
    stock: 15,
    active: true,
  },
  {
    name: "Château Les Ancres",
    safra: "2019",
    origem: "Bordeaux, França",
    price: 210.0,
    image_url: "/vinhos/chateau-les-ancres.webp",
    uva: "Cabernet Sauvignon",
    category: "Tintos",
    description: "Estrutura firme com notas de tabaco e especiarias.",
    pontuacao: 91,
    stock: 30,
    active: true,
  },
  {
    name: "Don David Reserva",
    safra: "2021",
    origem: "Salta, Argentina",
    price: 165.0,
    image_url: "/vinhos/don-david.webp",
    uva: "Malbec",
    category: "Tintos",
    description: "Potência e cor intensa típicas da altitude argentina.",
    pontuacao: 89,
    stock: 45,
    active: true,
  },
  {
    name: "Limestone Coast Chardonnay",
    safra: "2022",
    origem: "Austrália",
    price: 178.0,
    image_url: "/vinhos/limestone-coast.webp",
    uva: "Chardonnay",
    category: "Brancos",
    description: "Notas amanteigadas e toque sutil de carvalho.",
    pontuacao: 90,
    stock: 35,
    active: true,
  },
  {
    name: "Montegras Reserva Especial",
    safra: "2020",
    origem: "Vale do Colchagua, Chile",
    price: 155.0,
    image_url: "/vinhos/montegras.webp",
    uva: "Carmenere",
    category: "Tintos",
    description: "O expoente máximo da uva Carmenere chilena.",
    pontuacao: 91,
    stock: 50,
    active: true,
  },
  {
    name: "Rioja Reserva Especial",
    safra: "2017",
    origem: "Rioja, Espanha",
    price: 295.0,
    image_url: "/vinhos/rioja.webp",
    uva: "Tempranillo",
    category: "Tintos",
    description: "Envelhecido em carvalho, notas de baunilha e couro.",
    pontuacao: 94,
    stock: 20,
    active: true,
  },
  {
    name: "Vinarija Perak Especial",
    safra: "2021",
    origem: "Kutjevo, Croácia",
    price: 220.0,
    image_url: "/vinhos/vinarija-perak-espacial.webp",
    uva: "Graševina",
    category: "Brancos",
    description: "Um vinho exótico e elegante do leste europeu.",
    pontuacao: 92,
    stock: 12,
    active: true,
  },
];

async function seed(): Promise<void> {
  try {
    process.stdout.write("⏳ Iniciando Reset total do Banco de Dados...\n");

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(env.MONGO_URI);
    }

    // 1. Limpeza total
    await Promise.all([
      AdminModel.deleteMany({}),
      CustomerModel.deleteMany({}),
      ProductModel.deleteMany({}),
    ]);
    process.stdout.write("🧹 Banco limpo com sucesso.\n");

    // 2. Criação dos Utilizadores
    const passwordToHash = env.INITIAL_ADMIN_PASSWORD || "admin123";
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    const adminData = {
      name: "Admin Master",
      email: env.INITIAL_ADMIN_EMAIL || "admin@taverna.com",
      password: hashedPassword,
      role: "admin",
      permissions: ["all"],
    };

    const customerData = {
      name: "Nilton Cliente",
      email: "cliente@teste.com",
      password: hashedPassword,
      role: "customer",
    };

    await AdminModel.create(adminData);
    await CustomerModel.create(customerData);
    process.stdout.write("👥 Utilizadores (Admin/Cliente) criados.\n");

    // 3. Inserção dos Vinhos
    await ProductModel.insertMany(vinhosReais);
    process.stdout.write(
      `🍷 ${vinhosReais.length} Vinhos importados para o catálogo.\n`,
    );

    process.stdout.write(
      "✅ PROCESSO CONCLUÍDO: Taverna Reserva está pronta!\n",
    );
  } catch (error) {
    process.stderr.write(
      `❌ Erro no Master Seed: ${error instanceof Error ? error.message : error}\n`,
    );
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();
