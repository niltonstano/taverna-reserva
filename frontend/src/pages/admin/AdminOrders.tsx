import { CheckCircle, Clock, Eye, Package, RefreshCw, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders'); // Rota que busca todas as ordens no backend
      setOrders(res.data);
    } catch (err) {
      console.error('Erro ao procurar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { status: newStatus });
      fetchOrders(); // Recarrega a lista
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const statusConfig = {
    pending: { label: 'Pendente', color: 'text-amber-500', icon: Clock },
    processing: { label: 'Preparando', color: 'text-blue-500', icon: Package },
    shipped: { label: 'Enviado', color: 'text-purple-500', icon: Truck },
    delivered: { label: 'Entregue', color: 'text-emerald-500', icon: CheckCircle },
  };

  return (
    <div className="p-8 bg-[#050505] min-h-screen text-white">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-serif italic">
            Gestão de <span className="text-[#c2410c]">Pedidos</span>
          </h1>
          <p className="text-zinc-500 font-cinzel text-[10px] tracking-widest uppercase">Controle de Saída da Adega</p>
        </div>
        <button onClick={fetchOrders} className="p-3 bg-white/5 rounded-full hover:bg-[#c2410c] transition-all">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="grid gap-6">
        {orders.map((order: any) => (
          <div
            key={order._id}
            className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-cinzel text-[10px] text-zinc-500 uppercase tracking-widest">ID: {order._id}</span>
                <span
                  className={`font-cinzel text-[9px] px-3 py-1 rounded-full bg-white/5 font-black uppercase tracking-tighter ${
                    statusConfig[order.status as keyof typeof statusConfig]?.color
                  }`}
                >
                  {statusConfig[order.status as keyof typeof statusConfig]?.label}
                </span>
              </div>
              <h3 className="text-lg font-serif italic">
                {order.items.length} Rótulos • Total: R$ {order.totalPrice.toFixed(2)}
              </h3>
              <p className="text-zinc-600 text-[10px] uppercase font-cinzel">{new Date(order.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={order.status}
                onChange={(e) => updateStatus(order._id, e.target.value)}
                className="bg-black border border-white/10 rounded-full px-4 py-2 font-cinzel text-[10px] uppercase tracking-widest outline-none focus:border-[#c2410c] transition-all"
              >
                <option value="pending">Pendente</option>
                <option value="processing">Preparando</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
              </select>
              <button className="p-3 bg-white/5 rounded-full hover:text-[#c2410c] transition-colors">
                <Eye size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
