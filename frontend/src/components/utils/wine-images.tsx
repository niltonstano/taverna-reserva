export const FALLBACK_WINE_IMAGE = '/vinhos/rioja.webp';

export function resolveWineImage(item: any): string {
  if (!item) return FALLBACK_WINE_IMAGE;

  // O banco agora envia o caminho certinho no campo imageUrl
  const img = item.imageUrl || item.image_url;

  if (img && img.length > 5) {
    // Retorna o que está no banco. Se não começar com /, a gente adiciona
    return img.startsWith('/') ? img : `/vinhos/${img}`;
  }

  return FALLBACK_WINE_IMAGE;
}
