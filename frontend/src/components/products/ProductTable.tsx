import { Edit2, Trash2, Zap } from 'lucide-react';
import { api } from '../../services/api';

/* ===================== TIPOS ===================== */

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url?: string;
  image?: string;
  img?: string;
  uva?: string;
  origem?: string;
  safra?: string;
  emOferta?: boolean;
}

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onRefresh: () => void;
}

/* ===================== COMPONENT ===================== */

export function ProductTable({ products, onEdit, onRefresh }: ProductTableProps) {
  async function handleDelete(id: string) {
    const confirmDelete = window.confirm('Deseja realmente remover este rótulo da adega?');
    if (!confirmDelete) return;

    const rawToken = localStorage.getItem('@TavernaReserva:token');
    const token = rawToken?.replace(/["']/g, '').trim();

    if (!token) {
      alert('Sessão expirada. Faça login novamente.');
      return;
    }

    try {
      await api.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao excluir o rótulo. Verifique sua permissão.');
    }
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.02]">
            <th className="p-5 text-[10px] font-cinzel text-zinc-500 uppercase tracking-widest">Rótulo / Safra</th>
            <th className="p-5 text-[10px] font-cinzel text-zinc-500 uppercase tracking-widest">Uva / Terroir</th>
            <th className="p-5 text-[10px] font-cinzel text-zinc-500 uppercase tracking-widest text-center">Estoque</th>
            <th className="p-5 text-[10px] font-cinzel text-zinc-500 uppercase tracking-widest">Preço</th>
            <th className="p-5 text-[10px] font-cinzel text-zinc-500 uppercase tracking-widest text-right">Ações</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {products.map((product) => {
            const imgSource = product.image_url || product.image || product.img || '/vinhos/rioja.webp';

            return (
              <tr
                key={product._id} // 🔥 chave estável e correta
                className="hover:bg-white/[0.02] transition-colors group"
              >
                {/* RÓTULO */}
                <td className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-16 bg-neutral-900 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                      <img
                        src={imgSource}
                        alt={product.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/vinhos/rioja.webp';
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-serif italic text-white text-base leading-tight">{product.name}</p>
                        {product.emOferta && <Zap size={10} className="text-orange-500 fill-orange-500" />}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-[#c2410c] uppercase font-cinzel font-bold tracking-wider">{product.category}</span>
                        {product.safra && <span className="text-[9px] text-zinc-500 font-cinzel">• {product.safra}</span>}
                      </div>
                    </div>
                  </div>
                </td>

                {/* UVA / ORIGEM */}
                <td className="p-5">
                  <p className="text-xs text-zinc-300 font-medium">{product.uva || 'Varietal'}</p>
                  <p className="text-[10px] text-zinc-500 italic mt-0.5">{product.origem || 'Internacional'}</p>
                </td>

                {/* ESTOQUE */}
                <td className="p-5 text-center">
                  <span
                    className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tighter border ${
                      product.stock > 0 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}
                  >
                    {product.stock} un
                  </span>
                </td>

                {/* PREÇO */}
                <td className="p-5">
                  <p className="text-sm font-bold text-white">
                    {product.price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                </td>

                {/* AÇÕES */}
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2.5 bg-white/5 hover:bg-[#c2410c]/20 text-zinc-400 hover:text-[#c2410c] rounded-xl transition-all border border-white/5"
                      title="Editar Rótulo"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-2.5 bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 rounded-xl transition-all border border-white/5"
                      title="Excluir Rótulo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
