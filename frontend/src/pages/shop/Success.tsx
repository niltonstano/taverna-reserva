import { CheckCircle2, MessageSquare, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Success() {
  const navigate = useNavigate();

  // Caso você queira pegar informações do pedido via URL futuramente
  const orderNumber = Math.floor(Math.random() * 90000) + 10000;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Ícone de Sucesso Animado */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#c2410c] blur-3xl opacity-20 animate-pulse" />
            <CheckCircle2 size={80} className="text-[#c2410c] relative z-10" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-serif italic tracking-tight">Reserva Solicitada</h1>
          <p className="text-zinc-500 font-cinzel text-[10px] uppercase tracking-[0.3em]">Pedido #{orderNumber} • Em processamento</p>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-[300px] mx-auto">
            Sua seleção foi reservada com sucesso. Nossa equipe entrará em contato em breve para os detalhes da entrega.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center justify-center gap-3 bg-[#c2410c] hover:bg-[#a8380a] transition-colors px-8 py-5 rounded-full font-cinzel text-[10px] uppercase tracking-widest text-black font-black"
          >
            <ShoppingBag size={16} /> Continuar Coleção
          </button>

          <button
            onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
            className="flex items-center justify-center gap-3 border border-white/10 hover:bg-white/5 transition-colors px-8 py-5 rounded-full font-cinzel text-[10px] uppercase tracking-widest text-zinc-400"
          >
            <MessageSquare size={16} /> Suporte via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
