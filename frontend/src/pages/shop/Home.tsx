import { ArrowRight, MapPin, ShieldCheck, Wine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';

const ALL_TERROIRS = [
  { id: 'italia', title: 'Itália', subtitle: 'Toscana & Piemonte', cover: '/terroirs/italia.webp' },
  { id: 'franca', title: 'França', subtitle: 'Bordeaux & Champagne', cover: '/terroirs/franca.webp' },
  { id: 'chile', title: 'Chile', subtitle: 'Vale do Maipo', cover: '/terroirs/chile.webp' },
  { id: 'espanha', title: 'Espanha', subtitle: 'Rioja & Priorat', cover: '/terroirs/espanha.webp' },
  { id: 'portugal', title: 'Portugal', subtitle: 'Vale do Douro', cover: '/terroirs/barril.webp' },
  { id: 'argentina', title: 'Argentina', subtitle: 'Mendoza & Salta', cover: '/terroirs/argentina.webp' },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#050505] text-zinc-100 min-h-screen font-serif selection:bg-[#c2410c] selection:text-white">
      {/* 1. HERO SECTION - CINEMATOGRÁFICO */}
      <section className="relative h-[90vh] flex flex-col justify-center px-6 md:px-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/bg/hero-bg.webp" className="w-full h-full object-cover opacity-45 brightness-125 scale-105 animate-slow-zoom" alt="Fundo" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] w-12 bg-[#c2410c]" />
            <p className="font-cinzel text-[9px] tracking-[0.8em] text-[#c2410c] font-black uppercase">Established 2026</p>
          </div>

          <h1 className="mb-12">
            <span className="text-7xl md:text-[9rem] text-white leading-[0.8] font-serif italic block mb-2">Taverna</span>
            <span className="text-lg md:text-3xl font-cinzel font-black tracking-[0.4em] text-[#c2410c] uppercase">Reserva de Terroirs</span>
          </h1>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <button
              onClick={() => navigate('/catalog')}
              className="group px-14 py-6 bg-[#c2410c] hover:bg-white text-black rounded-full transition-all duration-500 font-cinzel text-[10px] font-black tracking-widest flex items-center gap-4 shadow-2xl shadow-orange-950/40 active:scale-95"
            >
              ENTRAR NA CAVE <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
          <div className="w-[1px] h-16 bg-gradient-to-b from-[#c2410c] to-transparent" />
        </div>
      </section>

      {/* 2. BRAND STATS / HERITAGE - LINKS ATIVADOS */}
      <section className="py-24 border-y border-white/5 bg-black/40 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
          {/* CURADORIA */}
          <div
            onClick={() => navigate('/catalog')}
            className="flex flex-col items-center text-center space-y-4 group cursor-pointer hover:-translate-y-1 transition-all duration-500"
          >
            <div className="p-4 rounded-full bg-white/5 group-hover:bg-[#c2410c]/10 transition-colors">
              <Wine className="text-[#c2410c] opacity-50 group-hover:opacity-100 transition-opacity" size={32} />
            </div>
            <h4 className="font-serif italic text-2xl">Curadoria Rara</h4>
            <p className="font-cinzel text-[9px] text-zinc-500 tracking-widest uppercase max-w-[200px]">Rótulos selecionados por especialistas</p>
            <span className="text-[8px] font-cinzel text-[#c2410c] opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest pt-2">
              Ver Seleção
            </span>
          </div>

          {/* ORIGEM - AGORA LEVA PARA O RASTREIO */}
          <div
            onClick={() => navigate('/tracking')}
            className="flex flex-col items-center text-center space-y-4 border-x border-white/5 group cursor-pointer hover:-translate-y-1 transition-all duration-500 px-4"
          >
            <div className="p-4 rounded-full bg-white/5 group-hover:bg-[#c2410c]/10 transition-colors">
              <MapPin className="text-[#c2410c] opacity-50 group-hover:opacity-100 transition-opacity" size={32} />
            </div>
            <h4 className="font-serif italic text-2xl">Origem Protegida</h4>
            <p className="font-cinzel text-[9px] text-zinc-500 tracking-widest uppercase max-w-[200px]">Logística climatizada e segura</p>
            <span className="text-[8px] font-cinzel text-[#c2410c] opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest pt-2">
              Rastrear Reserva
            </span>
          </div>

          {/* MEMBROS */}
          <div
            onClick={() => navigate('/login')}
            className="flex flex-col items-center text-center space-y-4 group cursor-pointer hover:-translate-y-1 transition-all duration-500"
          >
            <div className="p-4 rounded-full bg-white/5 group-hover:bg-[#c2410c]/10 transition-colors">
              <ShieldCheck className="text-[#c2410c] opacity-50 group-hover:opacity-100 transition-opacity" size={32} />
            </div>
            <h4 className="font-serif italic text-2xl">Membros Taverna</h4>
            <p className="font-cinzel text-[9px] text-zinc-500 tracking-widest uppercase max-w-[200px]">Acesso exclusivo a safras de colecionador</p>
            <span className="text-[8px] font-cinzel text-[#c2410c] opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest pt-2">
              Tornar-se Membro
            </span>
          </div>
        </div>
      </section>

      {/* 3. TERROIRS GRID */}
      <section className="py-32 bg-[#050505] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#c2410c]/5 blur-[180px] rounded-full pointer-events-none" />

        <div className="max-w-[1300px] mx-auto px-6 relative z-10">
          <div className="mb-24 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-1.5 rotate-45 bg-[#c2410c]" />
                <h2 className="font-cinzel text-[10px] tracking-[0.5em] text-[#c2410c] uppercase font-black">Atlas de Sensações</h2>
              </div>
              <p className="text-5xl md:text-7xl font-serif text-white italic leading-tight">
                Navegue pelos <span className="text-[#c2410c]">Terroirs</span>
              </p>
            </div>
            <button
              onClick={() => navigate('/catalog')}
              className="font-cinzel text-[10px] tracking-widest uppercase border-b border-[#c2410c] pb-2 text-zinc-400 hover:text-white transition-colors"
            >
              Ver Catálogo Completo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {ALL_TERROIRS.map((exp, index) => (
              <div
                key={exp.id}
                onClick={() => navigate(`/catalog`)}
                style={{ transitionDelay: `${index * 100}ms` }}
                className="group cursor-pointer relative h-[450px] rounded-[40px] overflow-hidden bg-zinc-950 transition-all duration-1000 border border-white/5 hover:border-[#c2410c]/30 animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
              >
                <img
                  src={exp.cover}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-[1.5s]"
                  alt={exp.title}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity" />

                <div className="absolute inset-0 p-10 flex flex-col justify-end z-20">
                  <div className="overflow-hidden">
                    <h3 className="text-4xl font-serif text-white italic translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
                      {exp.title}
                    </h3>
                  </div>
                  <div className="h-[1px] w-0 group-hover:w-full bg-[#c2410c] my-4 transition-all duration-700" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-cinzel text-zinc-400 group-hover:text-[#c2410c] uppercase tracking-[0.2em] translate-y-8 group-hover:translate-y-0 transition-transform duration-700 delay-100 font-bold">
                      {exp.subtitle}
                    </p>
                  </div>
                </div>

                <div className="absolute top-8 right-8 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 -translate-y-4 group-hover:translate-y-0">
                  <ArrowRight size={18} className="text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s infinite alternate ease-in-out;
        }
      `}</style>
    </div>
  );
}
