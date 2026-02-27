import { Eye, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { resolveWineImage } from '../../components/utils/wine-images';
import { useAdminData } from '../../hooks/useAdminData';
import { api } from '../../services/api';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'text-amber-500' },
  processing: { label: 'Preparando', color: 'text-blue-500' },
  shipped: { label: 'Enviado', color: 'text-purple-500' },
  delivered: { label: 'Entregue', color: 'text-emerald-500' },
  cancelled: { label: 'Cancelado', color: 'text-red-500' },
};

export function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState('');

  // Hook centralizado para dados
  const { data: orders, setData: setOrders, loading, refresh } = useAdminData<any>('admin/orders');

  // Atualização de status com feedback instantâneo (Optimistic UI)
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      alert('Erro ao atualizar status. Tente novamente.');
      refresh();
    }
  };

  // Filtro inteligente
  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const term = searchTerm.toLowerCase();
      const customer = (order.user?.name || order.user?.username || order.customer?.name || '').toLowerCase();
      const orderId = String(order._id || order.id || '').toLowerCase();
      return customer.includes(term) || orderId.includes(term);
    });
  }, [orders, searchTerm]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 pb-20 font-sans">
      {/* Navbar Superior */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <h1 className="font-serif italic text-2xl text-white">
            Taverna<span className="text-[#c2410c]">.</span>Orders
          </h1>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header e Busca */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 justify-between items-center">
          <div className="text-center md:text-left">
            <h2 className="text-white text-2xl font-medium tracking-tight">Gestão de Pedidos</h2>
            <p className="text-zinc-500 text-xs mt-1 italic tracking-widest uppercase">Controle de Saída e Logística</p>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input
              type="text"
              placeholder="Buscar por cliente ou ID do pedido..."
              className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-3.5 rounded-2xl text-xs outline-none focus:border-orange-500 transition-all placeholder:text-zinc-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Listagem principal */}
        <div className="grid gap-4">
          {loading && orders.length === 0 ? (
            <div className="text-center py-32 opacity-30 italic font-serif text-2xl animate-pulse">Consultando adega...</div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order: any) => {
              // Agora usamos a função global que resolve a imagem perfeitamente
              const previewImg = resolveWineImage(order.items?.[0]);
              const status = STATUS_CONFIG[order.status] || { label: order.status, color: 'text-zinc-400' };

              return (
                <div
                  key={order._id}
                  className="group bg-zinc-900/20 border border-white/5 rounded-[32px] p-5 hover:border-orange-500/20 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex gap-6">
                      {/* Preview da Garrafa Sincronizado */}
                      <div className="w-16 h-20 bg-black/40 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 overflow-hidden shadow-inner">
                        <img
                          src={previewImg}
                          alt="Produto"
                          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>

                      {/* Dados do Pedido */}
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-[10px] text-zinc-600 font-mono font-bold bg-white/5 px-2 py-0.5 rounded">
                            #{String(order._id).slice(-6).toUpperCase()}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
                        </div>

                        <h3 className="text-white font-medium text-lg">{order.user?.name || order.user?.username || 'Cliente Taverna'}</h3>

                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-zinc-400 text-[11px] font-bold">
                              {order.items?.length || 0} {order.items?.length === 1 ? 'Item' : 'Itens'}
                            </span>
                          </div>
                          <span className="text-orange-200/40 text-[11px] font-mono">R$ {Number(order.totalPrice || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-3 self-end lg:self-center">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase cursor-pointer text-zinc-500 hover:text-white hover:border-orange-500/50 transition-all outline-none appearance-none text-center"
                      >
                        <option value="pending">Pendente</option>
                        <option value="processing">Preparando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>

                      <button
                        title="Ver Detalhes"
                        className="p-3.5 bg-white/5 rounded-xl text-zinc-500 hover:bg-[#c2410c] hover:text-white transition-all shadow-lg"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
              <p className="text-zinc-600 italic">Nenhum pedido encontrado na adega.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
