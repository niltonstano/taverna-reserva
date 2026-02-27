export const getProductImage = (name: string = '', currentImage?: string) => {
  // Se já existir uma imagem válida vinda do banco (que não seja a padrão), usamos ela
  if (currentImage && currentImage.includes('/') && !currentImage.endsWith('rioja.webp')) {
    return currentImage;
  }

  const normalizedName = name.toLowerCase();

  // Mapeamento Centralizado
  const images: Record<string, string> = {
    rioja: '/vinhos/rioja.webp',
    perak: '/vinhos/vinarija-perak-espacial.webp',
    montegras: '/vinhos/montegras.webp',
    'pinot grigio': '/vinhos/pinot-grigio.webp',
    chianti: '/vinhos/melini-chianti.webp',
    'don david': '/vinhos/don-davud.webp',
    'cono sur': '/vinhos/cono-sur.webp',
    limestone: '/vinhos/limestone-coast.webp',
    bourgogne: '/vinhos/bourgogne.webp',
    ancres: '/vinhos/chateu-les-ancres.webp',
    teyssier: '/vinhos/chateau-teyssier.webp',
    'alta pinot': '/vinhos/alta-pinot-gridio.webp',
  };

  // Busca a primeira palavra-chave que bater com o nome
  const key = Object.keys(images).find((k) => normalizedName.includes(k));

  return key ? images[key] : '/vinhos/rioja.webp';
};
