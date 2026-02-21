import { ChevronRight, Trash2, User as UserIcon } from 'lucide-react';
import React, { useMemo } from 'react';
import type { AdminCustomer, AdminItem, AdminProduct } from '../../types/admin';

// --- TYPE GUARDS ---
function isProduct(item: AdminItem): item is AdminProduct {
  return 'price' in item || 'category' in item;
}

function isCustomer(item: AdminItem): item is AdminCustomer {
  return 'role' in item || 'email' in item;
}

export const AdminCard = React.memo(
  ({
    item,
    type,
    onEdit,
    onDelete,
    resolveImagePath,
  }: {
    item: AdminItem;
    type: 'products' | 'customers';
    onEdit: (item: AdminItem) => void;
    onDelete: (id: string) => void;
    resolveImagePath: (item: AdminItem) => string;
  }) => {
    if (!item) return null;

    const isProductTab = type === 'products';
    const itemId = item._id;

    const categoryDisplay = useMemo(() => {
      // 1. Lógica para Aba de Clientes
      if (!isProductTab && isCustomer(item)) {
        return item.role === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE ATIVO';
      }

      // 2. Lógica para Aba de Produtos (Onde fica a lógica de singular)
      if (isProductTab && isProduct(item)) {
        const rawCat = String(item.category || (item as any).categoria || 'Vinho');
        const rawSub = String((item as any).type || (item as any).wine_type || (item as any).tipo || '');

        const toSingular = (text: string) => {
          return text
            .split(' ')
            .map((word) => {
              let w = word.trim();
              const check = w.toLowerCase();
              if (['tinto', 'branco', 'rosé', 'rose'].includes(check)) return w;
              if (check.endsWith('s') && check.length > 3) return w.slice(0, -1);
              return w;
            })
            .join(' ');
        };

        const finalCat = toSingular(rawCat).toUpperCase();
        const finalSub = toSingular(rawSub).toUpperCase();

        if (finalSub && finalCat.includes(finalSub)) return finalCat;
        return finalSub ? `${finalCat} ${finalSub}` : finalCat;
      }

      return 'ITEM';
    }, [isProductTab, item]);

    // Nome unificado (Produto usa .name, Cliente pode usar .username ou .name)
    const displayName =
      isProductTab && isProduct(item) ? (item.name || 'Sem Nome').trim() : ((item as AdminCustomer).username || item.name || 'Sem Nome').trim();

    return (
      <div className="group p-4 rounded-[24px] bg-zinc-900/40 border border-white/5 hover:border-[#c2410c]/40 transition-all duration-500 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* LADO ESQUERDO: IMAGEM OU ÍCONE */}
          <div className="w-16 h-20 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
            {isProductTab && isProduct(item) ? (
              <img
                src={resolveImagePath(item)}
                alt={displayName}
                className="h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = '/vinhos/rioja.webp';
                }}
              />
            ) : (
              <div className={`p-3 rounded-full ${isCustomer(item) && item.role === 'admin' ? 'bg-amber-500/10' : 'bg-[#c2410c]/10'}`}>
                <UserIcon className={isCustomer(item) && item.role === 'admin' ? 'text-amber-500' : 'text-[#c2410c]'} size={24} />
              </div>
            )}
          </div>

          {/* CENTRO: INFORMAÇÕES */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${!isProductTab && isCustomer(item) && item.role === 'admin' ? 'text-amber-500' : 'text-[#c2410c]'}`}
              >
                {categoryDisplay}
              </span>

              {isProductTab && isProduct(item) && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${(Number(item.stock) || 0) > 0 ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
                >
                  {item.stock || 0} UN
                </span>
              )}
            </div>

            <h3 className="text-white font-serif italic text-lg truncate leading-tight">{displayName}</h3>

            <p className="text-zinc-500 text-xs mt-1 font-mono truncate">
              {isProductTab && isProduct(item)
                ? Number(item.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : (item as AdminCustomer).email || 'Sem e-mail cadastrado'}
            </p>
          </div>

          {/* LADO DIREITO: BOTÕES DE AÇÃO */}
          <div className="flex flex-col gap-2 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-2.5 bg-white/5 hover:bg-[#c2410c] rounded-xl text-zinc-400 hover:text-white transition-all shadow-lg"
            >
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (itemId) onDelete(itemId);
              }}
              className="p-2.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-xl transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  },
);

AdminCard.displayName = 'AdminCard';
