import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';
import { WineCard } from '../../components/products/WineCard';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

export function Catalog() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await api.get('/products');
        const rawData = res.data.data || res.data.products || (Array.isArray(res.data) ? res.data : []);
        setProducts(rawData);
      } catch (err) {
        console.error('Erro ao carregar catálogo:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categoryFilter = searchParams.get('category');

  const vinhosExibidos = products.filter((v) => {
    const naoEhOferta = v.emOferta !== true;
    const matchesCategory = categoryFilter ? v.category?.toLowerCase() === categoryFilter.toLowerCase() : true;
    return naoEhOferta && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img src="/bg/adega1.webp" className="w-full h-full object-cover grayscale opacity-[0.12] brightness-125" alt="Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-44 pb-24 relative z-10 flex-grow w-full">
        <header className="mb-28 text-center">
          {/* Texto Superior Animado */}
          <p className="text-[#c2410c] font-cinzel text-[11px] tracking-[0.7em] uppercase mb-6 opacity-80 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Curadoria Exclusiva
          </p>

          {/* Título Principal Animado */}
          <h1 className="text-6xl md:text-8xl font-serif italic mb-8 capitalize leading-none tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
            {categoryFilter ? categoryFilter : 'Nossa'} <span className="text-[#c2410c]">Reserva</span>
          </h1>

          {/* ÍCONE PADRONIZADO (Substituindo o pontinho/linha instável) */}
          <div className="flex items-center justify-center gap-4 animate-in fade-in zoom-in duration-1000 delay-500">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c2410c]/50" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#c2410c] shadow-[0_0_10px_#c2410c]" />
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c2410c]/50" />
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-16 h-16 border-2 border-[#c2410c]/10 border-t-[#c2410c] rounded-full animate-spin mb-8" />
            <p className="text-[#c2410c] font-cinzel text-xs uppercase tracking-[0.4em]">Sincronizando adega...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-32 gap-x-12">
            {vinhosExibidos.map((product, index) => {
              const productId = product._id || product.id;
              return (
                <div
                  key={productId}
                  className="animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <WineCard
                    wine={product}
                    variant="grid"
                    onAction={() => navigate(`/product/${productId}`)}
                    onBuy={() => {
                      addToCart(product);
                      navigate('/cart');
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {!loading && vinhosExibidos.length === 0 && (
          <div className="text-center py-52 opacity-20 italic font-serif text-3xl tracking-tighter animate-in fade-in duration-700">
            Nenhum rótulo disponível nesta seção.
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
