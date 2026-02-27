import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, MessageCircle, ShieldCheck, Wine } from 'lucide-react';
import { useEffect } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  whatsappUrl: string;
  orderId?: string;
  onClose?: () => void;
}

export function SuccessModal({ isOpen, whatsappUrl, orderId, onClose }: SuccessModalProps) {
  // Efeito de Confetes
  useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#c2410c', '#fbbf24'] });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#c2410c', '#ffffff'] });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Overlay de fundo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />

          {/* Card do Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
          >
            <div className="p-8 md:p-12 text-center relative">
              <div className="relative z-10">
                {/* Badge Protocolo */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#c2410c]/20 rounded-full bg-[#c2410c]/5 mb-8">
                  <ShieldCheck size={12} className="text-[#c2410c]" />
                  <span className="text-[#c2410c] font-mono text-[10px] uppercase tracking-widest">RESERVA #{orderId || 'PROCESSANDO'}</span>
                </div>

                {/* Ícone de Sucesso */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-[#c2410c] rounded-full flex items-center justify-center shadow-lg shadow-[#c2410c]/40">
                    <CheckCircle2 size={40} className="text-black stroke-[3px]" />
                  </div>
                </div>

                <h2 className="text-4xl md:text-5xl font-serif italic text-white mb-4">
                  Reserva <span className="text-[#c2410c]">Eternizada.</span>
                </h2>

                <p className="text-zinc-400 text-sm md:text-base mb-10 max-w-xs mx-auto">
                  Sua curadoria foi recebida. Conecte-se agora ao nosso Sommelier para os detalhes finais.
                </p>

                {/* Botão Principal */}
                <button
                  onClick={() => window.open(whatsappUrl, '_blank')}
                  className="w-full bg-white text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all uppercase tracking-widest text-xs"
                >
                  <MessageCircle size={18} />
                  Falar com Sommelier
                </button>

                <button onClick={onClose} className="mt-6 text-zinc-500 hover:text-white text-[10px] uppercase tracking-[0.3em] transition-colors">
                  Fechar
                </button>
              </div>

              {/* Marca d'água */}
              <Wine className="absolute -right-10 -bottom-10 text-white/[0.03] rotate-12" size={200} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
