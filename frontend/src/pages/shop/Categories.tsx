import { ArrowRight, Flame, Moon, ShoppingBag, Sparkles, Wine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';

export function Categories() {
  const navigate = useNavigate();

  const categories = [
    {
      name: 'Tintos',
      desc: 'Encorpados e Intensos',
      icon: <Wine size={20} />,
      path: '/catalog?category=tinto',
      color: 'hover:border-red-950/40',
    },
    {
      name: 'Brancos',
      desc: 'Leves e Refrescantes',
      icon: <Sparkles size={20} />,
      path: '/catalog?category=branco',
      color: 'hover:border-yellow-600/20',
    },
    {
      name: 'Rosés',
      desc: 'Delicadeza e Frescor',
      icon: <Flame size={20} />,
      path: '/catalog?category=rosé',
      color: 'hover:border-pink-600/20',
    },
    {
      name: 'Espumantes',
      desc: 'Celebração e Borbulhas',
      icon: <Sparkles size={20} />,
      path: '/catalog?category=espumante',
      color: 'hover:border-blue-400/20',
    },
    {
      name: 'Sobremesa',
      desc: 'Doces e Licorosos',
      icon: <Moon size={20} />,
      path: '/catalog?category=sobremesa',
      color: 'hover:border-amber-600/20',
    },
    {
      name: 'Acessórios',
      desc: 'A Arte de Servir',
      icon: <ShoppingBag size={20} />,
      path: '/catalog?category=acessorios',
      color: 'hover:border-zinc-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {/* BACKGROUND IMERSIVO */}
      <div className="fixed inset-0 z-0">
        <img src="/bg/hero-bg.webp" className="w-full h-full object-cover grayscale opacity-[0.15]" alt="Art" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-transparent to-[#050505]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-40 pb-20 relative z-10 flex-grow w-full">
        <header className="mb-24 animate-in fade-in slide-in-from-left-6 duration-1000">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] w-12 bg-[#c2410c]" />
            <p className="text-[#c2410c] font-cinzel text-[10px] tracking-[0.6em] uppercase">Private Collections</p>
          </div>
          <h1 className="text-7xl md:text-9xl font-serif italic tracking-tighter leading-[0.8] mb-4">
            Nossas <span className="text-[#c2410c]">Coleções</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, index) => (
            <div
              key={cat.name}
              onClick={() => navigate(cat.path)}
              className={`group relative h-[300px] rounded-[50px] overflow-hidden cursor-pointer border border-white/5 ${cat.color} bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-700 p-12 flex flex-col justify-between shadow-2xl backdrop-blur-sm`}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 rounded-full bg-white/5 text-zinc-500 group-hover:text-[#c2410c] group-hover:bg-[#c2410c]/10 transition-all duration-500">
                  {cat.icon}
                </div>
                <span className="text-[10px] font-cinzel text-zinc-800 uppercase tracking-widest">0{index + 1}</span>
              </div>

              <div className="relative z-10">
                <h3 className="text-5xl font-serif italic mb-3 group-hover:text-white transition-colors">{cat.name}</h3>
                <p className="text-zinc-600 font-cinzel text-[9px] tracking-[0.3em] uppercase mb-8 group-hover:text-[#c2410c] transition-colors">
                  {cat.desc}
                </p>
                <div className="flex items-center gap-3 text-[#c2410c] opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-700 font-cinzel text-[9px] tracking-[0.4em] uppercase">
                  Explorar <ArrowRight size={14} />
                </div>
              </div>

              {/* Marca d'água artística */}
              <div className="absolute -right-6 -bottom-8 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-1000 group-hover:scale-110">
                <div className="text-[180px] font-serif italic select-none leading-none">{cat.name[0]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
