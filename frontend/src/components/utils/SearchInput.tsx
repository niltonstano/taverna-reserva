import { Loader2, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api'; // Ajuste o caminho da sua API

export function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de Busca com Debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get(`/products?search=${query}&limit=5`);
        setResults(response.data.products);
        setIsOpen(true);
      } catch (error) {
        console.error('Erro na busca', error);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms de delay para economizar requisições

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="hidden sm:flex flex-1 max-w-md relative group mx-4" ref={containerRef}>
      <div className="relative w-full">
        {isLoading ? (
          <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c2410c] animate-spin" size={12} />
        ) : (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && setIsOpen(true)}
          placeholder="Buscar rótulos, uvas ou terroirs..."
          className="w-full bg-zinc-900/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-[10px] text-zinc-300 outline-none focus:border-[#c2410c]/40 transition-all font-cinzel tracking-widest"
        />
      </div>

      {/* DROPDOWN DE RESULTADOS INTELIGENTES */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-2xl overflow-hidden z-[60] backdrop-blur-xl">
          <div className="p-2">
            {results.map((product: any) => (
              <button
                key={product.id}
                onClick={() => {
                  navigate(`/product/${product.id}`);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-left group/item"
              >
                <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-lg border border-white/5" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-white font-serif italic group-hover/item:text-[#c2410c]">{product.name}</span>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">
                    {product.category} • {product.uva}
                  </span>
                </div>
                <span className="ml-auto text-[10px] font-black text-[#c2410c]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate(`/catalog?search=${query}`)}
            className="w-full py-2 bg-white/5 text-[8px] font-black uppercase text-zinc-400 hover:text-white transition-colors border-t border-white/5"
          >
            Ver todos os resultados
          </button>
        </div>
      )}
    </div>
  );
}
