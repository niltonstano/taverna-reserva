import { ShoppingCart, Star } from 'lucide-react';

interface Wine {
  id?: string | number;
  _id?: string | number;
  name?: string;
  nome?: string;
  price?: number;
  preco?: any;
  image_url?: string;
  imagem?: string;
  origem?: string;
  pontuacao?: number;
}

interface WineCardProps {
  wine: Wine;
  onAction?: (wine: Wine) => void;
  onBuy?: (wine: Wine) => void;
  variant?: 'grid' | 'compact';
}

export function WineCard({ wine, onAction, onBuy, variant = 'grid' }: WineCardProps) {
  const name = wine.name || wine.nome || 'Rótulo Premium';
  const score = wine.pontuacao || 95;
  const origin = wine.origem || 'Terroir Selecionado';

  const rawPrice = wine.price || (typeof wine.preco === 'string' ? parseFloat(wine.preco.replace(/[^\d,]/g, '').replace(',', '.')) : wine.preco) || 0;

  const FALLBACK_LOCAL = '/vinhos/rioja.webp';
  const dbImage = (wine.image_url || wine.imagem || '').trim();

  let imagePath = FALLBACK_LOCAL;
  if (dbImage) {
    if (dbImage.startsWith('http')) {
      imagePath = dbImage;
    } else {
      const cleanPath = dbImage.startsWith('/') ? dbImage : `/${dbImage}`;
      imagePath = cleanPath.startsWith('/vinhos') ? cleanPath : `/vinhos${cleanPath}`;
    }
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={() => onAction?.(wine)}
        className="flex items-center gap-4 p-3 bg-zinc-900/40 border border-white/5 rounded-2xl hover:bg-zinc-800/60 transition-all cursor-pointer group"
      >
        <div className="w-14 h-20 bg-black/40 rounded-xl flex items-center justify-center p-2 shrink-0 overflow-hidden">
          <img src={imagePath} alt={name} className="h-full w-auto object-contain transition-transform group-hover:scale-110" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-white font-serif italic text-sm truncate">{name}</h4>
          <p className="text-[#c2410c] font-bold text-xs mt-1">{rawPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBuy?.(wine);
          }}
          className="p-2 text-zinc-500 hover:text-[#c2410c]"
        >
          <ShoppingCart size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col h-full bg-[#0a0a0a] border border-white/[0.03] rounded-[45px] p-8 transition-all duration-700 hover:border-[#c2410c]/40 hover:shadow-[0_0_50px_-12px_rgba(194,65,12,0.3)]">
      {/* 1. Score Badge */}
      <div className="absolute top-6 right-8 z-20">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#c2410c]/30 shadow-xl">
          <Star size={12} className="text-[#c2410c] fill-[#c2410c]" />
          <span className="text-white text-[11px] font-black tracking-tighter">{score} PTS</span>
        </div>
      </div>

      {/* 2. Container da Garrafa */}
      <div onClick={() => onAction?.(wine)} className="relative flex-grow flex flex-col items-center justify-center cursor-pointer min-h-[380px]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#c2410c]/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

        <img
          src={imagePath}
          alt={name}
          className="relative z-10 h-[320px] w-auto object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.8)] group-hover:scale-110 group-hover:-rotate-2 transition-all duration-700"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = FALLBACK_LOCAL;
          }}
        />

        <div className="mt-8 text-center w-full">
          {/* PADRONIZAÇÃO: Diamante em vez de MapPin para evitar o "pontinho" */}
          <div className="flex items-center justify-center gap-3 text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold mb-3">
            <div className="w-1 h-1 rotate-45 bg-[#c2410c]" />
            <span className="animate-in fade-in duration-1000">{origin}</span>
            <div className="w-1 h-1 rotate-45 bg-[#c2410c]" />
          </div>

          <h3 className="text-white font-serif italic text-3xl leading-tight px-2 group-hover:text-[#c2410c] transition-colors duration-500 line-clamp-2">
            {name}
          </h3>
        </div>
      </div>

      {/* 3. Footer de Ação */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onBuy?.(wine);
        }}
        className="mt-8 pt-6 border-t border-white/[0.05] cursor-pointer"
      >
        <div className="flex items-center justify-between group/price">
          <div className="flex flex-col">
            <span className="text-zinc-600 text-[9px] uppercase tracking-[0.2em] font-bold">Investimento</span>
            <span className="text-white font-serif text-2xl tracking-tight mt-0.5">
              {rawPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover/price:bg-[#c2410c] group-hover/price:border-[#c2410c] transition-all duration-500 shadow-2xl">
            <ShoppingCart size={20} className="text-white group-hover/price:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
