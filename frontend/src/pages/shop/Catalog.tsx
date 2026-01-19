import { useEffect, useMemo, useState } from 'react';
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

  // 1. Carregamento dos dados com limite alto para permitir filtro no frontend
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        // Aumentamos o limite para 100 para trazer todos os vinhos de uma vez
        const res = await api.get('/products?limit=100');

        const rawData = res.data.data || res.data.products || (Array.isArray(res.data) ? res.data : []);

        console.log('📦 API respondeu com:', rawData.length, 'produtos.');
        setProducts(rawData);
      } catch (err) {
        console.error('❌ Erro ao carregar catálogo:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categoryFilter = searchParams.get('category');

  // 2. Lógica de Filtro Inteligente (Frontend Side)
  const vinhosExibidos = useMemo(() => {
    if (!products || products.length === 0) return [];

    // Se não houver filtro na URL, exibe os que NÃO são oferta
    if (!categoryFilter) return products.filter((v) => v.emOferta !== true);

    // Função de limpeza: minúsculo, sem acento, sem espaços e sem plural
    const normalizar = (s: any) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/s$/, ''); // transforma "tintos" em "tinto"

    const termoBusca = normalizar(categoryFilter);

    const filtrados = products.filter((v) => {
      // Tenta ler 'category' ou 'categoria' do objeto do banco
      const catBanco = normalizar(v.category || v.categoria || '');

      // Log para conferência no F12
      console.log(`🔎 Filtrando: Banco [${catBanco}] vs URL [${termoBusca}]`);

      return catBanco.includes(termoBusca) || termoBusca.includes(catBanco);
    });

    console.log(`🍷 Filtro aplicado: ${filtrados.length} vinhos encontrados.`);
    return filtrados;
  }, [products, categoryFilter]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="fixed inset-0 z-0">
        <img src="/bg/adega1.webp" className="w-full h-full object-cover grayscale opacity-[0.12] brightness-125" alt="Adega" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-44 pb-24 relative z-10 flex-grow w-full">
        <header className="mb-28 text-center">
          <p className="text-[#c2410c] font-cinzel text-[11px] tracking-[0.7em] uppercase mb-6 opacity-80">Curadoria Exclusiva</p>
          <h1 className="text-6xl md:text-8xl font-serif italic mb-8 capitalize leading-none tracking-tighter">
            {categoryFilter ? categoryFilter : 'Nossa'} <span className="text-[#c2410c]">Reserva</span>
          </h1>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-16 h-16 border-2 border-[#c2410c]/10 border-t-[#c2410c] rounded-full animate-spin mb-8" />
            <p className="text-[#c2410c] font-cinzel text-[10px] tracking-widest uppercase animate-pulse">Sincronizando adega...</p>
          </div>
        ) : (
          <>
            {vinhosExibidos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-32 gap-x-12">
                {vinhosExibidos.map((product) => (
                  <WineCard
                    key={product._id || product.id}
                    wine={product}
                    onAction={() => navigate(`/product/${product._id || product.id}`)}
                    onBuy={() => {
                      addToCart(product);
                      navigate('/cart');
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-40 animate-in fade-in duration-1000">
                <p className="italic font-serif text-3xl opacity-20 mb-12">Nenhum rótulo encontrado para "{categoryFilter}".</p>
                <button
                  onClick={() => navigate('/catalog')}
                  className="group flex items-center gap-4 mx-auto text-[#c2410c] font-cinzel text-[10px] tracking-[0.4em] uppercase hover:opacity-70 transition-all"
                >
                  <div className="h-[1px] w-8 bg-[#c2410c] group-hover:w-12 transition-all" />
                  Ver catálogo completo
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
