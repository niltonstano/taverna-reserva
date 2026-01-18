import { Facebook, Instagram, Wine, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Footer() {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#050505] py-20 border-t border-white/5 relative overflow-hidden">
      {/* GLOW DE FUNDO PADRONIZADO */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#c2410c]/5 blur-[120px] rounded-full -mb-60 -mr-60" />

      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
        {/* LOGO FOOTER */}
        <div onClick={scrollToTop} className="flex items-center gap-5 cursor-pointer group">
          <div className="p-3 border border-[#c2410c]/30 rounded-2xl group-hover:bg-[#c2410c]/10 transition-all">
            <Wine className="text-[#c2410c]" size={32} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-serif italic text-4xl text-white leading-none">Taverna</span>
            <span className="font-cinzel text-[10px] tracking-[0.5em] text-[#c2410c] font-black mt-1">RESERVA</span>
          </div>
        </div>

        {/* LINKS DE NAVEGAÇÃO */}
        <div className="flex flex-wrap justify-center gap-12 font-cinzel text-[9px] tracking-[0.4em] text-zinc-500 uppercase font-black">
          {[
            { label: 'Entrar', path: '/login' },
            { label: 'Produtos', path: '/catalog' },
            { label: 'Clube Reserva', path: '/club' },
          ].map((link) => (
            <button key={link.path} onClick={() => navigate(link.path)} className="hover:text-white transition-colors relative group">
              {link.label}
              <span className="absolute -bottom-2 left-0 w-0 h-px bg-[#c2410c] group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </div>

        {/* REDES SOCIAIS */}
        <div className="flex gap-8 text-zinc-500">
          <Instagram
            size={20}
            className="hover:text-[#c2410c] transition-all cursor-pointer hover:-translate-y-1"
            onClick={() => window.open('https://instagram.com', '_blank')}
          />
          <Youtube
            size={20}
            className="hover:text-[#c2410c] transition-all cursor-pointer hover:-translate-y-1"
            onClick={() => window.open('https://youtube.com', '_blank')}
          />
          <Facebook
            size={20}
            className="hover:text-[#c2410c] transition-all cursor-pointer hover:-translate-y-1"
            onClick={() => window.open('https://facebook.com', '_blank')}
          />
        </div>
      </div>

      <div className="mt-20 text-center border-t border-white/5 pt-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-2">
          <p className="text-[8px] font-cinzel tracking-[0.4em] text-zinc-800 uppercase font-black">
            © 2026 Taverna Reserva Terroirs • Lote Exclusivo
          </p>

          {/* ✅ LINK DISCRETO PARA O ADMIN 
              Ele parece apenas um ponto final ou um detalhe visual,
              mas leva para a tela de login administrativa. */}
          <button
            onClick={() => navigate('/admin/login')}
            className="w-1 h-1 bg-zinc-900 rounded-full hover:bg-[#c2410c] transition-colors cursor-default"
            title="Acesso Restrito"
          />
        </div>
      </div>
    </footer>
  );
}
