import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem } from '../../context/CartContext';

interface Props {
  item: CartItem;
  onUpdate: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  formatPrice: (v: number) => string;
  getCleanPrice: (p: any) => number;
}

export function CartItemCard({ item, onUpdate, onRemove, formatPrice, getCleanPrice }: Props) {
  // ✅ Captura o ID corretamente
  const itemId = String(item.id || (item as any)._id || '');

  // ✅ Captura o preço corretamente
  const itemPrice = getCleanPrice(item.preco || (item as any).price || (item as any).price);

  // ✅ LOGICA DE IMAGEM CORRIGIDA (Fallback para múltiplos campos)
  const imgSource = (item as any).image_url || (item as any).image || (item as any).img || '/vinhos/rioja.webp';

  return (
    <div className="bg-zinc-900/20 border border-white/5 p-6 rounded-[32px] flex flex-wrap items-center justify-between gap-6 hover:border-[#c2410c]/30 transition-all group">
      <div className="flex items-center gap-6">
        {/* Container da Imagem */}
        <div className="w-20 h-20 bg-black rounded-2xl p-2 flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
          <img
            src={imgSource}
            alt={item.nome || (item as any).name}
            className="h-full object-contain group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              // Se o link falhar, carrega a imagem padrão
              (e.target as HTMLImageElement).src = '/vinhos/rioja.webp';
            }}
          />
        </div>

        <div>
          <h4 className="font-serif italic text-xl text-white">{item.nome || (item as any).name}</h4>
          <p className="text-[#c2410c] font-cinzel text-[10px] tracking-widest mt-1 uppercase">
            {formatPrice(itemPrice)} <span className="text-zinc-600 ml-1">/ garrafa</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Controles de Quantidade */}
        <div className="flex items-center gap-4 bg-black/50 border border-white/10 rounded-full px-4 py-2">
          <button
            type="button"
            onClick={() => onUpdate(itemId, -1)}
            disabled={item.quantity <= 1}
            className="text-zinc-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus size={14} />
          </button>

          <span className="font-cinzel text-[12px] w-4 text-center text-white select-none">{item.quantity}</span>

          <button type="button" onClick={() => onUpdate(itemId, 1)} className="text-zinc-500 hover:text-white transition-colors">
            <Plus size={14} />
          </button>
        </div>

        {/* Botão Remover */}
        <button
          type="button"
          onClick={() => onRemove(itemId)}
          className="text-zinc-700 hover:text-red-500 transition-colors p-2"
          title="Remover da adega"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
