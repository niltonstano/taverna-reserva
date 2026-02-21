import { LayoutDashboard, Loader2, LogOut, Search, ShoppingBag, User, Wine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import type { Product } from '../../types/product';

/**
 * ✅ Componente de Busca Inteligente (Conectado à API Real)
 */
function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fecha o dropdown ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Lógica de Busca Conectada ao Banco de Dados (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 3) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        // Chamada para o banco real - agora vinhos novos aparecerão aqui!
        const { data } = await api.get(`/products?search=${encodeURIComponent(query)}&limit=5`);

        // Resiliência para o formato da resposta da API
        const productsFound = data.products || data.data || data || [];
        setResults(Array.isArray(productsFound) ? productsFound : []);
        setIsOpen(productsFound.length > 0);
      } catch (error) {
        console.error('Erro na busca preditiva:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="hidden sm:flex flex-1 max-w-md relative group mx-4" ref={containerRef}>
      <div className="relative w-full">
        {isLoading ? (
          <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c2410c] animate-spin" size={14} />
        ) : (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#c2410c] transition-colors" size={14} />
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && results.length > 0 && setIsOpen(true)}
          placeholder="Buscar rótulos, uvas ou terroirs..."
          className="w-full bg-zinc-900/40 border border-white/5 rounded-full py-2.5 pl-11 pr-4 text-[11px] text-zinc-300 outline-none focus:border-[#c2410c]/40 focus:bg-zinc-900/80 transition-all font-cinzel tracking-[0.1em]"
        />
      </div>

      {/* RESULTADOS PREDITIVOS */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[60] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 space-y-1">
            {results.map((product) => (
              <button
                key={product._id || product.id}
                onClick={() => {
                  navigate(`/product/${product._id || product.id}`);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all text-left group/item border border-transparent hover:border-white/5"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                  <img
                    src={product.image_url || product.imageUrl || product.imagem || '/vinhos/rioja.webp'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                    onError={(e) => (e.currentTarget.src = '/vinhos/rioja.webp')}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-white font-serif italic truncate group-hover/item:text-[#c2410c]">
                    {product.name || product.nome}
                  </span>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest">
                    {product.uva || 'Blend'} • {product.origem || 'Internacional'}
                  </span>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-[10px] font-black text-[#c2410c]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(product.price || product.preco || 0))}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              navigate(`/catalog?search=${query}`);
              setIsOpen(false);
            }}
            className="w-full py-3 bg-[#c2410c]/5 hover:bg-[#c2410c]/10 text-[9px] font-black uppercase text-[#c2410c] tracking-[0.2em] transition-colors border-t border-white/5"
          >
            Ver todos os rótulos
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * ✅ Header Principal
 */
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
          <Link to="/" className="flex items-center gap-2 md:gap-4 shrink-0 hover:opacity-80 transition-opacity">
            <div className="bg-[#c2410c] p-2 rounded-lg shadow-[0_0_20px_rgba(194,65,12,0.3)]">
              <Wine size={16} className="text-black md:w-5 md:h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif italic text-lg md:text-2xl text-white tracking-tight">Taverna</span>
              <span className="font-cinzel text-[7px] md:text-[9px] font-black tracking-[0.3em] text-[#c2410c] uppercase">Reserva</span>
            </div>
          </Link>

          {/* BUSCA INTELIGENTE */}
          <SearchInput />

          {/* ICONES DE AÇÃO */}
          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            {isLogged && (
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="p-2 text-zinc-500 hover:text-[#c2410c] transition-colors"
                title="Painel de Controle"
              >
                <LayoutDashboard size={18} />
              </Link>
            )}
            <Link to="/cart" className="relative p-2 group bg-zinc-900/40 border border-white/5 rounded-xl hover:border-[#c2410c]/30 transition-all">
              <ShoppingBag size={18} className="text-[#c2410c]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#c2410c] text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-in zoom-in duration-300">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* SEGUNDA LINHA: NAVEGAÇÃO | LOGIN */}
        <div className="flex flex-wrap items-center justify-between mt-6 border-t border-white/5 pt-4 gap-y-4">
          <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar max-w-[calc(100vw-40px)] sm:max-w-none scroll-smooth">
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

          <div className="flex items-center gap-4 ml-auto sm:ml-0">
            {isLogged ? (
              <div className="flex items-center gap-3">
                <div className="hidden xs:block text-right leading-tight">
                  <p className="text-[10px] text-white font-serif italic truncate max-w-[80px]">{user?.name?.split(' ')[0]}</p>
                </div>
                <Link
                  to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                  className="w-8 h-8 rounded-full border border-[#c2410c]/30 flex items-center justify-center text-[#c2410c] bg-zinc-900/50 hover:bg-[#c2410c] hover:text-black transition-all"
                >
                  <User size={14} />
                </Link>
                <button onClick={() => signOut()} className="text-zinc-600 hover:text-red-500 transition-colors" title="Sair">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link to="/login" className="font-cinzel text-[10px] text-zinc-500 uppercase font-bold hover:text-white transition-colors">
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="bg-[#c2410c] text-black px-5 py-2 font-cinzel text-[9px] font-black uppercase rounded-full whitespace-nowrap hover:scale-105 active:scale-95 transition-all shadow-[0_5px_15px_rgba(194,65,12,0.2)]"
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
