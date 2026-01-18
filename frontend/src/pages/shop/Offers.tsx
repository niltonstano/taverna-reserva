import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';
import { WineCard } from '../../components/products/WineCard';
import { useCart } from '../../context/CartContext'; // Importando seu contexto de carrinho
import { api } from '../../services/api';

export function Offers() {
  const navigate = useNavigate();
  const { addToCart } = useCart(); // Pegando a função de adicionar ao carrinho
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/products')
      .then((res) => {
        const result = res.data.products || res.data.data || res.data;
        const apenasOfertas = Array.isArray(result) ? result.filter((p: any) => p.emOferta === true) : [];
        setProducts(apenasOfertas);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img src="/bg/adega3.webp" className="w-full h-full object-cover grayscale opacity-[0.18] brightness-125" alt="Offers" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/30 to-[#050505]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#c2410c]/10 blur-[150px] rounded-full opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-40 pb-20 relative z-10 flex-grow w-full">
        <header className="mb-24 text-center">
          <button
            onClick={() => navigate('/catalog')}
            className="group flex items-center gap-3 text-zinc-400 hover:text-[#c2410c] transition-all mx-auto mb-10 font-cinzel text-[9px] uppercase tracking-[0.5em] animate-in fade-in slide-in-from-top-4 duration-1000"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-2 transition-transform" /> Retornar ao Acervo
          </button>

          <h1 className="text-6xl md:text-8xl font-serif italic mb-6 leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
            Seleção <span className="text-[#c2410c]">Especial</span>
          </h1>

          <div className="h-[1px] w-24 bg-[#c2410c]/40 mx-auto animate-in fade-in zoom-in duration-1000 delay-500" />
        </header>

        {loading ? (
          <div className="text-center py-32 text-[#c2410c] animate-pulse font-serif italic text-xl">Buscando raridades...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-24 gap-x-12">
            {products.map((product, index) => {
              const productId = product._id || product.id;
              return (
                <div
                  key={productId}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both"
                >
                  <WineCard
                    wine={product}
                    variant="grid"
                    // Clicar na imagem/card vai para o detalhe
                    onAction={() => navigate(`/product/${productId}`)}
                    // Clicar no botão de compra adiciona ao carrinho e navega
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
      </div>
      <Footer />
    </div>
  );
}
