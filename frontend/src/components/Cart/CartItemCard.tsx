import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItemCardProps } from '../../types/cart';

export default function CartItemCard({ item, onUpdate, onRemove, formatPrice, getCleanPrice }: CartItemCardProps) {
  // 🆔 Normalização do ID para garantir compatibilidade com MongoDB ou Local
  const itemId = String(item._id || item.id);

  // 💰 Normalização do Preço via utilitário de limpeza
  const price = getCleanPrice(item.price || item.preco || 0);

  // 🏷️ Proteção contra erro de renderização de objetos (Garante que o nome seja sempre string)
  const rawName = item.name || item.nome || 'Rótulo Taverna';
  const cleanName =
    typeof rawName === 'object' && rawName !== null ? (rawName as any).name || (rawName as any).nome || 'Rótulo Taverna' : String(rawName);

  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] flex items-center justify-between gap-6 hover:border-[#c2410c]/30 transition-all group">
      <div className="flex items-center gap-6">
        {/* IMAGEM DO RÓTULO */}
        <div className="w-20 h-20 bg-black rounded-2xl p-2 flex items-center justify-center border border-white/5 overflow-hidden">
          <img
            src={item.image_url || item.image || '/vinhos/rioja.webp'}
            alt={cleanName}
            className="h-full object-contain group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* INFORMAÇÕES DO PRODUTO */}
        <div className="flex flex-col">
          <h4 className="font-serif italic text-xl text-white leading-tight">{cleanName}</h4>
          <p className="text-[#c2410c] font-cinzel text-[10px] tracking-widest mt-1 uppercase">{formatPrice(price)}</p>
        </div>
      </div>

      {/* CONTROLES DE QUANTIDADE E REMOÇÃO */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 bg-black/50 border border-white/10 rounded-full px-4 py-2">
          <button
            type="button"
            onClick={() => onUpdate(itemId, -1)}
            disabled={item.quantity <= 1}
            className="text-zinc-500 hover:text-white disabled:opacity-20 transition-colors p-1"
          >
            <Minus size={14} />
          </button>

          <span className="font-cinzel text-[12px] text-white min-w-[20px] text-center">{item.quantity}</span>

          <button type="button" onClick={() => onUpdate(itemId, 1)} className="text-zinc-500 hover:text-white transition-colors p-1">
            <Plus size={14} />
          </button>
        </div>

        <button type="button" onClick={() => onRemove(itemId)} className="text-zinc-700 hover:text-red-500 transition-colors p-2">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
