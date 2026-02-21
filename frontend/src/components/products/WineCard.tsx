import { ShoppingCart, Star, Tag } from 'lucide-react';
import { memo, useMemo } from 'react';
import { FALLBACK_WINE_IMAGE, resolveWineImage } from '../../components/utils/wine-images';

// --- DEFINIÇÃO DE TIPAGEM FORTE ---
export interface Wine {
  _id?: string;
  id?: string;
  name: string;
  nome?: string;
  type?: string;
  wine_type?: string;
  category?: string;
  categoria?: string;
  price: number;
  preco?: number;
  oldPrice?: number;
  price_old?: number;
  preco_antigo?: number;
  emOferta?: boolean | string;
  isOffer?: boolean;
  pontuacao?: number | string;
  safra?: string | number;
  imageUrl?: string;
  image_url?: string;
  updatedAt?: string | Date;
}

interface WineCardProps {
  wine: Wine;
  onAction?: (wine: Wine) => void;
  onBuy?: (wine: Wine) => void;
  variant?: 'grid' | 'compact';
}

export const WineCard = memo(({ wine, onAction, onBuy, variant = 'grid' }: WineCardProps) => {
  // 1. Lógica de Exibição de Categoria/Tipo
  const wineTypeDisplay = useMemo(() => {
    const type = String(wine.type || wine.wine_type || wine.category || wine.categoria || 'Vinho');

    return type
      .split(' ')
      .map((word) => {
        let w = word.trim();
        const check = w.toLowerCase();
        if (['tinto', 'branco', 'rosé', 'rose'].includes(check)) return w;
        if (check.endsWith('s') && check.length > 3) return w.slice(0, -1);
        return w;
      })
      .join(' ')
      .toUpperCase();
  }, [wine]);

  // 2. Lógica de Nome
  const name = useMemo(() => (wine.name || wine.nome || 'Rótulo Premium').trim(), [wine.name, wine.nome]);

  // 3. Lógica de Preços e Promoção
  const { currentPrice, oldPrice, isPromo } = useMemo(() => {
    const price = wine.price ?? wine.preco ?? 0;
    const old = wine.oldPrice ?? wine.price_old ?? wine.preco_antigo ?? 0;
    const isPromoFlag = wine.emOferta === true || wine.emOferta === 'true' || wine.isOffer === true;

    return {
      currentPrice: price,
      oldPrice: old,
      isPromo: isPromoFlag || old > price,
    };
  }, [wine]);

  // 4. Lógica de Imagem
  const imagePath = useMemo(() => {
    const path = resolveWineImage(wine);
    const version = wine.updatedAt ? new Date(wine.updatedAt).getTime() : '1';
    return `${path}?v=${version}`;
  }, [wine]);

  // --- RENDERIZAÇÃO COMPACTA ---
  if (variant === 'compact') {
    return (
      <div
        onClick={() => onAction?.(wine)}
        className="flex items-center gap-4 p-4 bg-zinc-900/20 backdrop-blur-md border border-white/5 rounded-2xl hover:border-[#c2410c]/40 transition-all cursor-pointer group"
      >
        <div className="w-12 h-16 shrink-0">
          <img src={imagePath} alt={name} className="h-full w-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#c2410c] text-[7px] font-black tracking-[0.3em] uppercase">{wineTypeDisplay}</p>
          <h4 className="text-white text-sm font-serif italic truncate transition-colors group-hover:text-[#c2410c]">{name}</h4>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO GRID (PADRÃO) ---
  return (
    <div className="group relative flex flex-col h-full w-full max-w-[380px] bg-zinc-950/20 backdrop-blur-xl border border-white/[0.05] rounded-[45px] p-8 transition-all duration-700 hover:border-[#c2410c]/30 hover:bg-zinc-900/40 shadow-2xl mx-auto">
      {/* Badges */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
        <div className="min-h-[26px]">
          {isPromo && (
            <div className="bg-[#c2410c] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-in fade-in zoom-in duration-500">
              <Tag size={10} className="text-white fill-white" />
              <span className="text-white text-[9px] font-black tracking-widest uppercase">Oferta</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 ml-auto">
          <Star size={10} className="text-[#c2410c] fill-[#c2410c]" />
          <span className="text-white text-[10px] font-black tracking-tighter">{wine.pontuacao || 95}</span>
        </div>
      </div>

      {/* Imagem (Altura Fixa de Container) */}
      <div onClick={() => onAction?.(wine)} className="relative h-[320px] flex items-center justify-center cursor-pointer mt-4 shrink-0">
        <img
          src={imagePath}
          alt={name}
          className="relative z-10 h-full w-auto object-contain transition-all duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_WINE_IMAGE;
          }}
        />
      </div>

      {/* Conteúdo Centralizado com Alturas Mínimas para Simetria */}
      <div className="mt-8 text-center flex-grow flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#c2410c]/80 mb-3 block transition-all group-hover:tracking-[0.5em] shrink-0">
          {wineTypeDisplay}
        </span>

        {/* h3 com altura mínima para evitar desalinhamento entre 1 e 2 linhas */}
        <h3 className="text-zinc-100 font-serif italic text-3xl leading-tight px-2 line-clamp-2 min-h-[4.5rem] flex items-center justify-center transition-all duration-500 group-hover:text-[#c2410c] group-hover:[text-shadow:0_0_20px_rgba(194,65,12,0.2)]">
          {name}
        </h3>

        {/* Safra com container fixo para não "pular" o footer */}
        <div className="mt-4 min-h-[32px] flex items-center justify-center">
          {wine.safra && (
            <div className="opacity-40 group-hover:opacity-100 transition-opacity">
              <span className="text-zinc-400 text-[9px] uppercase tracking-[0.3em] font-bold border border-white/10 px-3 py-1 rounded-full group-hover:border-[#c2410c]/20">
                Safra {wine.safra}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Preço e Compra */}
      <div className="mt-10 pt-6 border-t border-white/[0.05] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="min-h-[16px]">
              {isPromo && (
                <span className="text-zinc-600 text-[10px] line-through block">
                  {oldPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              )}
            </div>
            <span className="text-white font-serif text-2xl tracking-tight transition-all group-hover:scale-105 origin-left">
              {currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onBuy?.(wine);
            }}
            className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-[#c2410c] hover:border-[#c2410c] hover:shadow-[0_0_20px_rgba(194,65,12,0.4)] transition-all active:scale-90"
          >
            <ShoppingCart size={20} className="text-white transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
});

WineCard.displayName = 'WineCard';
