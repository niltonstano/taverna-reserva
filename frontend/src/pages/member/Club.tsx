import { Check, Crown } from 'lucide-react';
import { Footer } from '../../components/common/Footer';

export function Club() {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden flex flex-col">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0 bg-[#050505]">
        <img src="/bg/adega2.webp" className="w-full h-full object-cover grayscale opacity-[0.10]" alt="Texture" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-40 pb-32 relative z-10 flex-grow">
        <div className="text-center max-w-3xl mx-auto mb-24 animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="inline-block p-6 rounded-[30px] bg-white/5 border border-white/10 mb-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#c2410c]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Crown size={48} className="text-[#c2410c] relative z-10" />
          </div>
          <h1 className="text-6xl md:text-8xl font-serif italic text-white tracking-tighter mb-8 leading-none">
            Clube <span className="text-[#c2410c]">Reserva</span>
          </h1>
          <p className="text-zinc-400 font-serif italic text-2xl leading-relaxed px-4 max-w-2xl mx-auto">
            Acesso vitalício às safras que nunca chegam às prateleiras comuns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto items-stretch">
          {/* CARD SIGNATURE */}
          <div className="bg-black/40 border border-[#c2410c]/30 p-12 md:p-16 rounded-[70px] backdrop-blur-md relative overflow-hidden group hover:border-[#c2410c] transition-all duration-700 shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#c2410c]/10 blur-[60px] group-hover:bg-[#c2410c]/20 transition-all" />
            <header className="mb-12">
              <p className="text-[#c2410c] font-cinzel text-[10px] tracking-[0.5em] uppercase font-black mb-4">Experiência Mensal</p>
              <h3 className="text-white font-serif italic text-5xl mb-4 leading-none">Signature</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-[#c2410c] font-cinzel text-sm font-black uppercase">R$</span>
                <span className="text-white font-cinzel text-5xl font-black tracking-tighter">290</span>
                <span className="text-zinc-600 font-serif italic text-lg ml-2">/ mês</span>
              </div>
            </header>
            <ul className="space-y-6 mb-16">
              {['3 Rótulos Premium/Mês', 'Logística Prime Bonificada', 'Degustação Online VIP', 'Acesso Antecipado a Lotes'].map((t, i) => (
                <li key={i} className="flex items-center gap-4 text-zinc-300 font-serif italic text-lg">
                  <div className="w-6 h-6 rounded-full bg-[#c2410c]/10 border border-[#c2410c]/20 flex items-center justify-center">
                    <Check size={14} className="text-[#c2410c]" />
                  </div>
                  {t}
                </li>
              ))}
            </ul>
            <button className="w-full py-7 bg-[#c2410c] hover:bg-white text-black font-cinzel font-black uppercase text-[11px] tracking-[0.4em] rounded-full transition-all duration-500 shadow-[0_20px_40px_rgba(194,65,12,0.3)]">
              Fazer Parte do Círculo
            </button>
          </div>

          {/* CARD LEGEND */}
          <div className="bg-white/[0.03] border border-white/5 p-12 md:p-16 rounded-[70px] backdrop-blur-sm relative overflow-hidden group hover:border-white/10 transition-all duration-1000 flex flex-col justify-center text-center">
            <div className="mb-8">
              <h3 className="text-white/30 font-serif italic text-5xl mb-3">Legend</h3>
              <p className="text-zinc-600 font-cinzel text-[9px] tracking-[0.4em] uppercase font-black italic">Em breve sob convite</p>
            </div>
            <div className="h-px w-24 bg-white/10 mx-auto mb-10" />
            <p className="text-zinc-500 font-serif italic text-xl leading-relaxed max-w-[280px] mx-auto">
              A experiência definitiva para colecionadores de grandes verticais e safras históricas.
            </p>
            <button className="mt-12 mx-auto text-[10px] font-cinzel text-zinc-500 uppercase tracking-[0.4em] border-b border-white/5 pb-2 hover:text-white transition-colors">
              Entrar na Lista de Espera
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
