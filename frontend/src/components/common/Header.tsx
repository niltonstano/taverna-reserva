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
    return `transition-all duration-300 tracking-[0.2em] font-cinzel text-[10px] uppercase relative pb-1 ${
      isActive
        ? 'text-[#c2410c] font-black after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-[#c2410c]'
        : 'text-zinc-500 hover:text-[#c2410c]'
    }`;
  };

  return (
    <header className="bg-[#050505]/95 border-b border-white/5 pt-6 pb-4 sticky top-0 z-50 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between gap-12">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-4 group shrink-0">
            <div className="bg-[#c2410c] p-2.5 rounded-lg group-hover:bg-[#ea580c] transition-all shadow-[0_0_20px_rgba(194,65,12,0.2)] group-hover:scale-105">
              <Wine size={20} className="text-black" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif italic text-2xl text-white tracking-tight">Taverna</span>
              <span className="font-cinzel text-[9px] font-black tracking-[0.5em] text-[#c2410c] uppercase mt-1">Reserva</span>
            </div>
          </Link>

          {/* BUSCA */}
          <div className="hidden md:flex flex-1 max-w-lg relative group">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#c2410c] transition-colors"
              size={14}
            />
            <input
              type="text"
              placeholder="Buscar rótulo ou terroir..."
              className="w-full bg-zinc-900/30 border border-white/10 rounded-full py-2.5 pl-12 pr-6 text-[11px] text-zinc-300 outline-none focus:border-[#c2410c]/40 focus:bg-zinc-900/60 transition-all font-cinzel tracking-widest placeholder:text-zinc-700"
            />
          </div>

          {/* AÇÕES */}
          <div className="flex items-center gap-4 shrink-0">
            {isLogged && (
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="p-2.5 text-zinc-500 hover:text-[#c2410c] transition-all flex items-center gap-2 group rounded-xl hover:bg-white/5"
              >
                <LayoutDashboard size={18} />
                <span className="text-[9px] font-cinzel tracking-widest hidden lg:block uppercase font-black">
                  {user?.role === 'admin' ? 'Painel' : 'Adega'}
                </span>
              </Link>
            )}

            <Link
              to="/cart"
              className="relative p-2.5 group bg-zinc-900/40 border border-white/5 hover:border-[#c2410c]/30 transition-all rounded-xl"
            >
              <ShoppingBag size={18} className="text-[#c2410c] group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#c2410c] text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_10px_rgba(194,65,12,0.4)]">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* NAVEGAÇÃO SECUNDÁRIA */}
        <div className="flex items-center justify-between mt-8 border-t border-white/5 pt-4">
          <nav className="flex items-center gap-8 lg:gap-12">
            <Link to="/catalog" className={getLinkClass('/catalog')}>
              Todos os Rótulos
            </Link>
            <Link to="/categories" className={getLinkClass('/categories')}>
              Explorar Terroirs
            </Link>
            <Link to="/offers" className={getLinkClass('/offers')}>
              Ofertas Especiais
            </Link>
            <Link to="/club" className={getLinkClass('/club')}>
              Clube Reserva
            </Link>
          </nav>

          {/* AUTH SECTION */}
          <div className="flex items-center gap-6">
            {isLogged ? (
              <div className="flex items-center gap-4 group">
                <div className="text-right hidden sm:block leading-tight">
                  <p className="text-[8px] text-[#c2410c] font-cinzel font-black uppercase tracking-tighter">
                    {user?.role === 'admin' ? 'Acesso Curador' : 'Sommelier Premium'}
                  </p>
                  <p className="text-[11px] text-white font-serif italic mb-1">{user?.name?.split(' ')[0]}</p>

                  {/* BOTÃO LOGOUT: Essencial para segurança com token temporário */}
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-1.5 ml-auto text-[8px] text-zinc-600 hover:text-red-500 transition-colors uppercase font-black tracking-widest group/btn"
                  >
                    <LogOut size={10} className="group-hover/btn:-translate-x-0.5 transition-transform" />
                    Encerrar Sessão
                  </button>
                </div>

                <Link
                  to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                  className="w-10 h-10 rounded-full border border-[#c2410c]/30 flex items-center justify-center text-[#c2410c] hover:bg-[#c2410c] hover:text-black transition-all bg-zinc-900/50"
                >
                  <User size={18} />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link
                  to="/login"
                  className="font-cinzel text-[10px] tracking-[0.2em] text-zinc-500 hover:text-[#c2410c] uppercase font-bold transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="bg-[#c2410c] text-black px-6 py-2 font-cinzel text-[10px] tracking-[0.2em] hover:bg-white transition-all font-black uppercase rounded-full"
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
