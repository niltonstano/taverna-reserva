import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';
import { WineCard } from '../../components/products/WineCard';
import { useCartActions } from '../../context/CartContext'; // Hook corrigido
import { api } from '../../services/api';

export function Offers() {
  const navigate = useNavigate();

  /**
   * Pegamos o addToCart do useCartActions para bater com a estrutura do seu Context.
   * Se o erro de tipagem persistir, verifique se addToCart está exportado no seu CartContext.
   */
  const { addToCart } = useCartActions();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        setLoading(true);
        // Adicionamos o timestamp t=${Date.now()} para evitar cache de rede
        const { data: res } = await api.get(`/products?limit=100&t=${Date.now()}`);
        const result = res.products || res.data || res;

        if (Array.isArray(result)) {
          const apenasOfertas = result.filter((p: any) => {
            // Lógica ultra-resiliente: verifica booleano e string "true"
            const isPromo =
              p.isOffer === true ||
              p.promotion === true ||
              p.emOferta === true ||
              String(p.isOffer).toLowerCase() === 'true' ||
              String(p.promotion).toLowerCase() === 'true';

            return p.active !== false && isPromo;
          });
          setProducts(apenasOfertas);
        }
      } catch (error) {
        console.error('[Offers] Erro ao carregar ofertas:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  const handleBuy = (product: any) => {
    if (addToCart) {
      addToCart(product);
      navigate('/cart');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="fixed inset-0 z-0">
        <img src="/bg/adega3.webp" className="w-full h-full object-cover grayscale opacity-[0.18] brightness-125" alt="Offers Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/30 to-[#050505]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#c2410c]/10 blur-[150px] rounded-full opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-40 pb-20 relative z-10 flex-grow w-full">
        <header className="mb-24 text-center">
          <button
            onClick={() => navigate('/catalog')}
            className="group flex items-center gap-3 text-zinc-400 hover:text-[#c2410c] transition-all mx-auto mb-10 font-cinzel text-[9px] uppercase tracking-[0.5em] animate-in fade-in slide-in-from-top-4 duration-1000"
          >
            Retornar ao Acervo
          </button>

          <h1 className="text-6xl md:text-8xl font-serif italic mb-6 leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
            Seleção <span className="text-[#c2410c]">Especial</span>
          </h1>

          <div className="h-[1px] w-24 bg-[#c2410c]/40 mx-auto animate-in fade-in zoom-in duration-1000 delay-500" />
        </header>

        {loading ? (
          <div className="text-center py-32 text-[#c2410c] animate-pulse font-serif italic text-xl">Buscando raridades em oferta...</div>
        ) : (
          <main className="min-h-[400px]">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-24 gap-x-12">
                {products.map((product, index) => {
                  const productId = product._id || product.id;
                  return (
                    <div
                      key={`${productId}-${index}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      className="animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both"
                    >
                      <WineCard wine={product} onAction={() => navigate(`/product/${productId}`)} onBuy={() => handleBuy(product)} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-32 opacity-40 italic font-serif text-2xl">Nenhuma oferta disponível no momento.</div>
            )}
          </main>
        )}
      </div>
      <Footer />
    </div>
  );
}
