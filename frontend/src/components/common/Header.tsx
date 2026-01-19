import { LayoutDashboard, LogOut, Search, ShoppingBag, User, Wine } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export function Header() {
  const { cartCount } = useCart();
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isLogged = !!user;

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `transition-all duration-300 tracking-[0.15em] font-cinzel text-[10px] uppercase relative pb-1 whitespace-nowrap ${
      isActive
        ? 'text-[#c2410c] font-black after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-[#c2410c]'
        : 'text-zinc-500 hover:text-[#c2410c]'
    }`;
  };

  return (
    <header className="bg-[#050505]/95 border-b border-white/5 pt-4 pb-4 sticky top-0 z-50 backdrop-blur-2xl w-full">
      <div className="max-w-7xl mx-auto px-4">
        {/* PRIMEIRA LINHA: LOGO | BUSCA | CARRINHO */}
        <div className="flex items-center justify-between gap-2 md:gap-8">
          {/* LOGO - Reduzido no mobile */}
          <Link to="/" className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="bg-[#c2410c] p-2 rounded-lg shadow-[0_0_15px_rgba(194,65,12,0.2)]">
              <Wine size={16} className="text-black md:w-5 md:h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif italic text-lg md:text-2xl text-white tracking-tight">Taverna</span>
              <span className="font-cinzel text-[7px] md:text-[9px] font-black tracking-[0.3em] text-[#c2410c] uppercase">Reserva</span>
            </div>
          </Link>

          {/* BUSCA - Esconde em telas muito pequenas (mobile portrait) */}
          <div className="hidden sm:flex flex-1 max-w-md relative group mx-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-zinc-900/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-[10px] text-zinc-300 outline-none focus:border-[#c2410c]/40 transition-all font-cinzel tracking-widest"
            />
          </div>

          {/* ICONES DE AÇÃO */}
          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            {isLogged && (
              <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="p-2 text-zinc-500 hover:text-[#c2410c]">
                <LayoutDashboard size={18} />
              </Link>
            )}
            <Link to="/cart" className="relative p-2 group bg-zinc-900/40 border border-white/5 rounded-xl">
              <ShoppingBag size={18} className="text-[#c2410c]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#c2410c] text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* SEGUNDA LINHA: NAVEGAÇÃO | LOGIN (Usa flex-wrap para mobile) */}
        <div className="flex flex-wrap items-center justify-between mt-6 border-t border-white/5 pt-4 gap-y-4">
          {/* MENU - Agora com Scroll Lateral real se não couber */}
          <nav className="flex items-center gap-5 overflow-x-auto no-scrollbar max-w-[calc(100vw-40px)] sm:max-w-none">
            <Link to="/catalog" className={getLinkClass('/catalog')}>
              Rótulos
            </Link>
            <Link to="/categories" className={getLinkClass('/categories')}>
              Terroirs
            </Link>
            <Link to="/offers" className={getLinkClass('/offers')}>
              Ofertas
            </Link>
            <Link to="/club" className={getLinkClass('/club')}>
              Clube
            </Link>
          </nav>

          {/* AUTH - Ajustada para nunca quebrar o layout */}
          <div className="flex items-center gap-4 ml-auto sm:ml-0">
            {isLogged ? (
              <div className="flex items-center gap-3">
                <div className="hidden xs:block text-right leading-tight">
                  <p className="text-[10px] text-white font-serif italic">{user?.name?.split(' ')[0]}</p>
                </div>
                <Link
                  to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                  className="w-8 h-8 rounded-full border border-[#c2410c]/30 flex items-center justify-center text-[#c2410c] bg-zinc-900/50"
                >
                  <User size={14} />
                </Link>
                <button onClick={() => signOut()} className="text-zinc-600 hover:text-red-500">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="font-cinzel text-[10px] text-zinc-500 uppercase font-bold">
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="bg-[#c2410c] text-black px-4 py-1.5 font-cinzel text-[9px] font-black uppercase rounded-full whitespace-nowrap"
                >
                  Fazer Parte
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
