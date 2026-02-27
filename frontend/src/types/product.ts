/**
 * Interface para logística e dimensões do produto.
 */
export interface Dimensions {
  width: number;
  height: number;
  length: number;
}

/**
 * Interface principal de Produto.
 * Resiliente a variações de API (MongoDB/SQL) e tradução de campos.
 */
export interface Product {
  // --- IDENTIFICADORES ---
  _id: string;
  id?: string | number;

  // --- IDENTIDADE ---
  name: string;
  nome?: string;
  description?: string;
  descricao?: string;
  category: string;
  active: boolean;

  // --- PRECIFICAÇÃO E ESTOQUE ---
  price: number | string;
  preco?: number | string;
  emOferta?: boolean;
  stock: number;

  // --- IMAGENS ---
  image?: string;
  imageUrl?: string;
  image_url?: string;
  imagem?: string;

  // --- ATRIBUTOS DE SOMMELIER ---
  safra?: string;
  uva?: string;
  origem?: string;
  country?: string;
  pontuacao?: number;

  // --- LOGÍSTICA E METADADOS ---
  dimensions?: Dimensions;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface específica para Vinhos que estende o Produto base.
 */
export interface Vinho extends Product {
  id: number; // Obrigatório para o mock interno
  safra: string;
  origem: string;
  corpo: string;
  temperatura: string;
  uva: string;
  pontuacao: number;
}

export type ProductFormState = Partial<Product>;
