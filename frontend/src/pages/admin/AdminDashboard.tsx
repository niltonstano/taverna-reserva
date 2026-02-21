import { ChevronRight, Plus, RefreshCw, Search, Trash2, User as UserIcon, Wine } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Componentes e Serviços
import { AdminModal } from '../../components/utils/AdminModal';
import { api } from '../../services/api';

// UI Components
import { AdminCardSkeleton } from '../../components/ui/AdminCardSkeleton';

// Tipagem Centralizada
import type { AdminCustomer, AdminItem, AdminProduct } from '../../types/admin';

// --- CONFIGURAÇÕES ---
const CATEGORIES = ['Todos', 'Vinho', 'Espumantes', 'Destilados', 'Acessórios'] as const;

/**
 * COMPONENTE: AdminCard
 * Memorizado e com lógica de singular automática para categorias.
 */
const AdminCard = React.memo(
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
    const isProductTab = type === 'products';
    if (!item) return null;

    const isProduct = (it: any): it is AdminProduct => 'price' in it || 'category' in it;
    const isCustomer = (it: any): it is AdminCustomer => 'role' in it;

    const itemId = item._id;
    const stock = isProduct(item) ? (item.stock ?? 0) : 0;
    const price = isProduct(item) ? (item.price ?? 0) : 0;

    const categoryDisplay = useMemo(() => {
      if (!isProductTab && isCustomer(item)) {
        return item.role === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE ATIVO';
      }

      if (isProductTab && isProduct(item)) {
        const rawCat = String(item.category || (item as any).categoria || 'Vinho');
        const rawSub = String((item as any).type || (item as any).wine_type || '');

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

    const displayName = isProductTab
      ? (item.name || (item as any).nome || 'Sem Nome').trim()
      : ((item as AdminCustomer).username || item.name || 'Sem Nome').trim();

    return (
      <div className="group p-4 rounded-[24px] bg-zinc-900/40 border border-white/5 hover:border-[#c2410c]/40 transition-all duration-500 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-20 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
            {isProductTab ? (
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${!isProductTab && isCustomer(item) && item.role === 'admin' ? 'text-amber-500' : 'text-[#c2410c]'}`}
              >
                {categoryDisplay}
              </span>
              {isProductTab && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${stock > 0 ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
                >
                  {stock} UN
                </span>
              )}
            </div>
            <h3 className="text-white font-serif italic text-lg truncate leading-tight">{displayName}</h3>
            <p className="text-zinc-500 text-xs mt-1 font-mono truncate">
              {isProductTab ? Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (item as AdminCustomer).email}
            </p>
          </div>

          <div className="flex flex-col gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              className="p-2.5 bg-white/5 hover:bg-[#c2410c] rounded-xl text-zinc-400 hover:text-white transition-all shadow-lg"
            >
              <ChevronRight size={18} />
            </button>
            <button onClick={() => onDelete(itemId)} className="p-2.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-xl transition-all">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  },
);

AdminCard.displayName = 'AdminCard';

/**
 * COMPONENTE PRINCIPAL: AdminDashboard
 */
export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'customers'>('products');
  const [data, setData] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdminItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'products' ? '/products' : '/customer';
      // Forçamos o limite para 50 para que a paginação do backend (que estava em 12) não esconda os vinhos
      const response = await api.get(`${endpoint}?limit=50&t=${Date.now()}`);

      const rawData = response.data?.data || response.data?.products || response.data?.customers || response.data || [];
      setData(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!id || !window.confirm('Excluir permanentemente?')) return;
    try {
      await api.delete(activeTab === 'products' ? `/products/${id}` : `/customer/${id}`);
      fetchData();
    } catch (err) {
      alert('Erro ao excluir registro.');
    }
  };

  const resolveImagePath = (item: AdminItem) => {
    const d = item as any;
    return d.imageUrl || d.image_url || d.image || d.imagem || '/vinhos/rioja.webp';
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setSelectedItem({
      _id: '',
      name: '',
      category: 'Vinho',
      price: 0,
      stock: 0,
      active: true,
      dimensions: { length: 0, height: 0, width: 0 },
    } as AdminItem);
    setIsModalOpen(true);
  };

  const handleEdit = (item: AdminItem) => {
    setIsEditing(true);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const d = item as any;
      const name = (d.name || d.nome || d.username || '').toLowerCase();
      const email = (d.email || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());

      const itemCat = String(d.category || d.categoria || 'Vinho');
      const matchesCat = activeTab === 'customers' || selectedCategory === 'Todos' || itemCat === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [data, searchTerm, selectedCategory, activeTab]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 pb-20 font-sans">
      <AdminModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        product={selectedItem}
        categories={[...CATEGORIES]}
        onClose={() => setIsModalOpen(false)}
        onChange={(updated) => setSelectedItem(updated as AdminItem)}
        onSave={fetchData}
        resolveImagePath={resolveImagePath}
      />

      <nav className="border-b border-white/5 bg-black/60 backdrop-blur-2xl sticky top-0 z-50 h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#c2410c] rounded-lg flex items-center justify-center">
              <Wine size={18} className="text-white" />
            </div>
            <h1 className="font-serif italic text-2xl text-white">
              Taverna<span className="text-[#c2410c]">.</span>Admin
            </h1>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Sincronizando' : 'Sincronizar'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row gap-6 mb-12 justify-between items-end">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            {(['products', 'customers'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchTerm('');
                  setSelectedCategory('Todos');
                }}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-[#c2410c] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'products' ? 'Produtos' : 'Clientes'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {activeTab === 'products' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-zinc-900 border border-white/10 px-5 py-3 rounded-xl text-[11px] font-bold uppercase text-zinc-400 outline-none focus:border-[#c2410c] cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input
                type="text"
                placeholder={activeTab === 'products' ? 'Pesquisar produtos...' : 'Buscar clientes...'}
                className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3 rounded-xl text-sm outline-none focus:border-[#c2410c] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {activeTab === 'products' && (
              <button
                onClick={handleAddNew}
                className="bg-white text-black p-3.5 rounded-xl hover:bg-[#c2410c] hover:text-white transition-all shadow-xl"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            // Renderiza Skeletons para um carregamento fluido e moderno
            Array.from({ length: 6 }).map((_, i) => <AdminCardSkeleton key={i} />)
          ) : filteredData.length > 0 ? (
            filteredData.map((item) => (
              <AdminCard
                key={item._id}
                item={item}
                type={activeTab}
                onDelete={handleDelete}
                onEdit={handleEdit}
                resolveImagePath={resolveImagePath}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center border border-dashed border-white/5 rounded-3xl">
              <p className="text-zinc-500 italic">Nenhum registro encontrado nesta categoria.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
