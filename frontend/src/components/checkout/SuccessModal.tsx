import { CheckCircle2, LayoutDashboard, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SuccessModalProps {
  isOpen: boolean;
  whatsappUrl: string;
}

export function SuccessModal({ isOpen, whatsappUrl }: SuccessModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleWhatsAppClick = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#050505]/95 backdrop-blur-md">
      <div className="bg-zinc-900 border border-[#c2410c]/30 p-12 rounded-[50px] max-w-md w-full text-center shadow-[0_0_50px_rgba(194,65,12,0.1)]">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-[#c2410c]/10 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle2 size={48} className="text-[#c2410c]" />
          </div>
        </div>

        <h2 className="text-3xl font-serif italic text-white mb-4">Reserva Confirmada</h2>

        <p className="text-zinc-400 font-cinzel text-[10px] uppercase tracking-widest leading-relaxed mb-10">
          Sua seleção exclusiva foi enviada. <br />
          Conclua o pagamento com nosso sommelier.
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-[#c2410c] text-black font-cinzel font-black py-5 rounded-full flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] hover:bg-white transition-all"
          >
            Falar no WhatsApp <MessageCircle size={16} />
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-transparent border border-white/10 text-zinc-500 font-cinzel py-5 rounded-full flex items-center justify-center gap-3 uppercase tracking-widest text-[9px] hover:text-white transition-all"
          >
            Ver Meus Pedidos <LayoutDashboard size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
