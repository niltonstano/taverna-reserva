import { CheckCircle, Clock, Loader2, Package, Search, Truck } from 'lucide-react';
import { useState } from 'react';
import { Footer } from '../../components/common/Footer';
import { api } from '../../services/api';

export function Tracking() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleTrack = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(false);
    setOrder(null);

    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'pending', label: 'Pendente', icon: Clock },
    { id: 'processing', label: 'Preparando', icon: Package },
    { id: 'shipped', label: 'Em Trânsito', icon: Truck },
    { id: 'delivered', label: 'Entregue', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === (order?.status || 'pending'));

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col pt-32 relative overflow-hidden">
      {/* CAMADA DE FUNDO - ESTILO CINEMATOGRÁFICO SÓBRIO */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img src="/bg/hero-bg.webp" className="w-full h-full object-cover opacity-40 brightness-[0.4] scale-105 animate-slow-zoom" alt="Fundo" />
        {/* Vinheta preta profunda para focar no conteúdo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Brilho Central Sutil (Substituindo o Laranja) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full h-[500px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto px-6 w-full flex-grow relative z-10">
        <header className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-1 h-4 bg-[#c2410c]" />
            <h2 className="font-cinzel text-[10px] tracking-[0.5em] text-zinc-400 uppercase">Status da Colheita</h2>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic mb-4">
            Rastrear <span className="text-white not-italic font-normal">Reserva</span>
          </h1>
          <p className="text-zinc-500 font-cinzel text-[10px] tracking-widest uppercase">Acompanhe o trajeto até sua adega particular</p>
        </header>

        {/* Busca - Design Minimalista Glassmorphism */}
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-1.5 rounded-full flex items-center mb-20 shadow-2xl focus-within:border-white/30 transition-all duration-700">
          <input
            type="text"
            placeholder="Insira o código da reserva..."
            className="bg-transparent flex-1 px-8 py-3 outline-none font-cinzel text-[11px] uppercase tracking-[0.2em] placeholder:text-zinc-700 disabled:opacity-50"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            disabled={loading}
          />
          <button
            onClick={handleTrack}
            disabled={loading || !orderId}
            className="bg-white text-black p-5 rounded-full hover:bg-[#c2410c] hover:text-white transition-all duration-500 disabled:opacity-20 shadow-xl"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          </button>
        </div>

        {/* Estados de Carregamento e Erro */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 animate-pulse">
            <div className="w-12 h-[1px] bg-[#c2410c] mb-6" />
            <p className="font-cinzel text-[9px] tracking-[0.3em] uppercase">Consultando Registros...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-zinc-400 font-serif italic text-lg">Código não localizado em nossa base.</p>
            <div className="w-10 h-[1px] bg-red-900/50 mx-auto mt-4" />
          </div>
        )}

        {order && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* Timeline - Estilo Luxo */}
            <div className="relative flex justify-between items-center mb-32 px-4 md:px-10">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] w-full bg-white/5 z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-zinc-800 via-[#c2410c] to-white transition-all duration-[2500ms] ease-in-out z-0"
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              />

              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`p-4 rounded-full border transition-all duration-1000 ${
                        isCompleted
                          ? 'bg-white border-white text-black shadow-[0_0_40px_rgba(255,255,255,0.15)]'
                          : 'bg-[#080808] border-white/5 text-zinc-800'
                      } ${isCurrent ? 'scale-110 shadow-[0_0_20px_#c2410c/20]' : ''}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="absolute -bottom-12 flex flex-col items-center">
                      <span
                        className={`whitespace-nowrap font-cinzel text-[8px] tracking-[0.3em] uppercase font-bold transition-colors duration-700 ${
                          isCompleted ? 'text-white' : 'text-zinc-800'
                        }`}
                      >
                        {step.label}
                      </span>
                      {isCurrent && <div className="w-1 h-1 bg-[#c2410c] rounded-full mt-2 animate-ping" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumo do Pedido - Estilo Dark Paper */}
            <div className="bg-[#080808]/40 border border-white/5 rounded-3xl p-8 md:p-12 mb-24 backdrop-blur-3xl relative">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                  <p className="text-[#c2410c] font-cinzel text-[8px] tracking-[0.4em] uppercase mb-2">Documento de Origem</p>
                  <h3 className="text-3xl font-serif italic tracking-tight text-white/90">Resumo da Reserva</h3>
                </div>
                <div className="bg-white/5 px-6 py-3 border border-white/10 rounded-full">
                  <p className="text-zinc-500 font-cinzel text-[7px] uppercase tracking-widest mb-1">Emissão</p>
                  <p className="font-serif text-sm italic">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '---'}</p>
                </div>
              </div>

              <div className="space-y-8 mb-12">
                {order.items?.map((item: any) => (
                  <div key={item.productId} className="flex justify-between items-end group">
                    <div className="flex items-center gap-6">
                      <span className="font-serif italic text-zinc-600 text-xl group-hover:text-[#c2410c] transition-colors">
                        {String(item.quantity).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="font-cinzel text-[10px] tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors uppercase">
                          {item.name}
                        </p>
                        <div className="h-[1px] w-0 group-hover:w-full bg-[#c2410c]/30 transition-all duration-700 mt-1" />
                      </div>
                    </div>
                    <span className="font-serif italic text-zinc-400">R$ {Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                  <p className="text-zinc-600 font-cinzel text-[8px] uppercase tracking-widest mb-1">Total do Investimento</p>
                  <p className="text-4xl font-serif text-white">
                    <span className="text-sm text-zinc-500 mr-2">BRL</span>
                    {Number(order.totalPrice || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3 opacity-40">
                  <div className="w-12 h-[1px] bg-zinc-700" />
                  <Package size={20} className="text-zinc-500" />
                  <div className="w-12 h-[1px] bg-zinc-700" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />

      <style>{`
        @keyframes slow-zoom {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(-1%, -1%); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 40s infinite alternate ease-in-out;
        }
      `}</style>
    </div>
  );
}
