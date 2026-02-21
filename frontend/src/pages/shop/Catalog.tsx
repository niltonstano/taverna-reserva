import { LayoutGrid, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';
import { WineCard } from '../../components/products/WineCard';
import { useCartActions } from '../../context/CartContext';
import { api } from '../../services/api';

export function Catalog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCartActions();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const displayCategory = category ? category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ') : 'Nossa';

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get(`/products?limit=100&t=${Date.now()}`);
      const result = res.products || res.data || res;

      if (Array.isArray(result)) {
        const allActive = result.filter((p: any) => p.active !== false);

        const checkIsPromo = (p: any) => {
          const isPromoFlag = p.emOferta === true || p.emOferta === 'true' || p.isOffer === true;
          const pName = String(p.name || '').toLowerCase();
          return isPromoFlag || pName.includes('oferta');
        };

        const isOfferPage = category?.toLowerCase() === 'ofertas';
        let filtered: any[] = [];

        if (isOfferPage) {
          filtered = allActive.filter((p) => checkIsPromo(p));
        } else {
          filtered = allActive.filter((p) => !checkIsPromo(p));
          if (!search && category && category.toLowerCase() !== 'todos') {
            const target = category.toLowerCase().replace(/-/g, ' ');
            filtered = filtered.filter((p: any) => {
              const c = String(p.category || '').toLowerCase();
              const t = String(p.type || '').toLowerCase();
              return c.includes(target) || t.includes(target);
            });
          }
        }

        if (search) {
          const target = search.toLowerCase().trim();
          filtered = filtered.filter((p: any) =>
            String(p.name || '')
              .toLowerCase()
              .includes(target),
          );
        }
        setProducts(filtered);
      }
    } catch (error) {
      console.error('[Catalog] Erro:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {/* Background Idêntico ao da página de Offers (Mais claro e vivo) */}
      <div className="fixed inset-0 z-0">
        <img src="/bg/adega1.webp" className="w-full h-full object-cover grayscale opacity-[0.18] brightness-125" alt="Catalog Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/30 to-[#050505]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#c2410c]/10 blur-[150px] rounded-full opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-40 pb-20 relative z-10 flex-grow w-full">
        {/* Header Minimalista e Sofisticado */}
        <header className="mb-32 text-center">
          <button
            onClick={() => navigate('/categories')}
            className="group flex items-center justify-center text-zinc-400 hover:text-[#c2410c] transition-all mx-auto mb-10 font-mono text-[9px] uppercase tracking-[0.5em] animate-in fade-in slide-in-from-top-4 duration-1000"
          >
            Explorar Categorias
          </button>

          <div className="inline-flex items-center gap-4 mb-4 opacity-50">
            <div className="h-[1px] w-8 bg-[#c2410c]" />
            <LayoutGrid size={12} className="text-[#c2410c]" />
            <div className="h-[1px] w-8 bg-[#c2410c]" />
          </div>

          <h1 className="text-6xl md:text-8xl font-serif italic mb-6 leading-tight tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
            {search ? 'Busca por' : displayCategory}
            <span className="text-[#c2410c] block md:inline md:ml-4">{search ? `"${search}"` : 'Adega'}</span>
          </h1>
          <div className="h-[1px] w-24 bg-[#c2410c]/40 mx-auto animate-in fade-in zoom-in duration-1000 delay-500" />
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <RefreshCw className="animate-spin text-[#c2410c]" size={32} strokeWidth={1} />
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-600 animate-pulse">Carregando Acervo</span>
          </div>
        ) : (
          <main className="min-h-[400px]">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-32 gap-x-16">
                {products.map((product, index) => (
                  <div
                    key={product.id || product._id}
                    className="flex justify-center animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <WineCard
                      wine={product}
                      onAction={(w: any) => navigate(`/product/${w.id || w._id}`)}
                      onBuy={(w: any) => {
                        addToCart(w);
                        navigate('/cart');
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="col-span-full text-center py-40">
                <p className="opacity-30 italic font-serif text-3xl mb-4">Nenhum rótulo encontrado.</p>
                <button
                  onClick={() => navigate('/catalog')}
                  className="text-[#c2410c] font-mono text-[10px] uppercase tracking-widest border-b border-[#c2410c]/20 pb-1 hover:border-[#c2410c] transition-all"
                >
                  Ver todos os vinhos
                </button>
              </div>
            )}
          </main>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Catalog;
