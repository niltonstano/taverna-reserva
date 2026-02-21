import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, MessageCircle, Sparkles, Wine } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function Success() {
  const location = useLocation();
  const navigate = useNavigate();

  // Recupera os dados do estado da navegação ou usa fallbacks seguros
  const { whatsappUrl, orderId } = (location.state as { whatsappUrl: string; orderId: string }) || {
    whatsappUrl: 'https://wa.me/5511999999999',
    orderId: 'TAVERNA',
  };

  useEffect(() => {
    // 1. Configuração da Lógica de Confetes (Efeito Celebração Profissional)
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Explosões laterais sincronizadas para não obstruir o texto central
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#c2410c', '#ffffff', '#fb923c'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#c2410c', '#ffffff', '#fb923c'],
      });
    }, 250);

    // 2. Redirecionamento de segurança (evita acesso direto à URL sem pedido)
    if (!location.state?.orderId) {
      const timer = setTimeout(() => navigate('/catalog'), 5000);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, [location.state, navigate]);

  return (
    <div className="relative min-h-screen w-full text-white flex flex-col items-center justify-center overflow-hidden bg-[#050505]">
      {/* Camada de Fundo com Imagem da Adega */}
      <div className="fixed inset-0 z-0">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 2 }}
          src="/bg/adega3.webp"
          className="w-full h-full object-cover grayscale"
          alt="Adega"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <main className="relative z-10 w-full max-w-2xl px-6 text-center">
        {/* Container Principal Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-12 md:p-20 rounded-[60px] shadow-2xl"
        >
          {/* Ícone Animado de Sucesso */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="w-24 h-24 bg-[#c2410c] rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(194,65,12,0.3)]"
              >
                <CheckCircle2 size={48} className="text-black" />
              </motion.div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-4 border border-dashed border-[#c2410c]/20 rounded-full"
              />
            </div>
          </div>

          <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-4">
            <span className="flex items-center justify-center gap-2 text-[#c2410c] uppercase tracking-[0.5em] text-[10px] font-cinzel">
              <Sparkles size={12} /> Reserva Confirmada
            </span>
            <h1 className="font-serif italic text-5xl md:text-7xl">
              Reserva <span className="text-[#c2410c]">Eternizada.</span>
            </h1>

            <div className="py-8">
              <div className="inline-block relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#c2410c]/50 to-orange-400/50 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative border border-[#c2410c]/30 px-8 py-2 rounded-full bg-black">
                  <p className="text-[#c2410c] font-cinzel text-[11px] uppercase tracking-[0.4em]">
                    Protocolo <span className="text-white">#{orderId}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.header>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-zinc-400 font-light text-lg leading-relaxed mb-12 max-w-md mx-auto"
          >
            Sua seleção foi reservada com exclusividade. Nossa equipe entrará em contato.
          </motion.p>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/catalog')}
              className="group relative px-8 py-5 border border-white/10 rounded-2xl transition-all overflow-hidden flex items-center justify-center gap-3"
            >
              <span className="text-zinc-400 group-hover:text-white font-cinzel text-[10px] uppercase tracking-[0.3em]">Continuar Coleção</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-all" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open(whatsappUrl, '_blank')}
              className="group relative px-8 py-5 bg-gradient-to-br from-[#c2410c] to-[#9a3412] rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
            >
              <MessageCircle size={18} className="text-black/80" />
              <span className="text-black font-cinzel font-black text-[10px] uppercase tracking-[0.3em]">Falar com Sommelier</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 1 }} className="pt-16 space-y-4">
          <div className="flex justify-center gap-4 text-[#c2410c]/50">
            <Wine size={16} />
          </div>
          <p className="text-[9px] uppercase tracking-[0.6em] font-cinzel">Taverna Reserva • Exclusividade em cada gota</p>
        </motion.footer>
      </main>
    </div>
  );
}
