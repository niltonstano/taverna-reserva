import { ArrowLeft, Loader2, LogOut, ShoppingBag, Star, Wine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  uva: string;
  safra: string;
  pontuacao: number;
  origem: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProductDetails() {
      const productId = location.state?.productId;
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/products/${productId}`);
        const data = response.data.data || response.data;
        setProduct(data);
      } catch (err) {
        console.error('Erro ao buscar produto:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProductDetails();
  }, [location.state]);

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        ...product,
        id: product._id,
        nome: product.name,
        preco: product.price,
        quantity: 1,
      } as any);
      navigate('/cart');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {/* BACKGROUND IMERSIVO PADRONIZADO */}
      <div className="fixed inset-0 z-0">
        <img src="/bg/adega3.webp" className="w-full h-full object-cover grayscale opacity-[0.15] brightness-110" alt="Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#c2410c]/5 blur-[150px] rounded-full opacity-40" />
      </div>

      <nav className="border-b border-white/5 px-8 py-6 flex justify-between items-center backdrop-blur-md bg-black/20 sticky top-0 z-50">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/catalog')}>
          <ArrowLeft size={18} className="text-[#c2410c] group-hover:-translate-x-1 transition-transform" />
          <span className="tracking-[0.3em] text-[10px] uppercase font-cinzel">Voltar à Adega</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="w-1 h-1 rotate-45 bg-[#c2410c]" />
          <span className="font-cinzel text-[10px] tracking-[0.5em] uppercase">Taverna Member</span>
          <div className="w-1 h-1 rotate-45 bg-[#c2410c]" />
        </div>
        <button
          onClick={signOut}
          className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] uppercase tracking-widest font-black"
        >
          Sair <LogOut size={14} />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12 relative z-10 flex-grow w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-[#c2410c]" size={40} />
            <p className="text-[#c2410c] font-cinzel text-[10px] tracking-widest uppercase">Consultando Reserva...</p>
          </div>
        ) : !product ? (
          <div className="text-center py-20 animate-in fade-in duration-1000">
            <h2 className="text-4xl italic mb-4 font-serif">Olá, {user?.name?.split(' ')[0] || 'Membro'}.</h2>
            <p className="text-zinc-500 mb-8 italic text-lg">Selecione um rótulo no catálogo para iniciar sua curadoria.</p>
            <button
              onClick={() => navigate('/catalog')}
              className="bg-[#c2410c] px-10 py-4 rounded-full font-cinzel text-[10px] text-black font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-orange-950/20"
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* GARRAFA COM ANIMAÇÃO */}
            <div className="relative flex justify-center items-center group animate-in fade-in slide-in-from-left-12 duration-1000">
              <div className="absolute w-[450px] h-[450px] bg-[#c2410c]/10 rounded-full blur-[120px] -z-10 animate-pulse" />
              <img
                src={product.image_url || '/vinhos/rioja.webp'}
                alt={product.name}
                className="h-[650px] object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.9)] group-hover:scale-105 group-hover:-rotate-1 transition-transform duration-1000"
              />
              <div className="absolute top-0 right-4 lg:right-20">
                <div className="bg-black/60 backdrop-blur-xl border border-[#c2410c]/40 p-6 rounded-full flex flex-col items-center justify-center shadow-2xl animate-in zoom-in duration-1000 delay-500">
                  <Star size={16} fill="#c2410c" className="text-[#c2410c] mb-1" />
                  <span className="text-2xl font-black italic">{product.pontuacao || 98}</span>
                  <span className="text-[8px] uppercase font-cinzel">PTS</span>
                </div>
              </div>
            </div>

            {/* DESCRIÇÃO COM EFEITO NAS FONTES */}
            <div className="space-y-10">
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
                <span className="text-[#c2410c] font-cinzel text-xs tracking-[0.5em] uppercase font-black">
                  Exclusividade {product.uva || 'Vinho Premium'} • Safra {product.safra || 'Especial'}
                </span>
                <h1 className="text-6xl md:text-8xl font-serif italic text-white mt-4 leading-[0.9] tracking-tighter">{product.name}</h1>
                <div className="flex items-center gap-3 mt-8">
                  <div className="w-1 h-1 rotate-45 bg-[#c2410c]" />
                  <p className="text-zinc-500 text-xs font-cinzel uppercase tracking-[0.4em]">Terroir: {product.origem || 'Internacional'}</p>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[50px] backdrop-blur-md relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Wine size={100} />
                </div>
                <h3 className="font-cinzel text-[10px] tracking-[0.3em] text-[#c2410c] uppercase mb-6 font-black">Perfil Sensorial</h3>
                <p className="text-zinc-200 text-xl leading-relaxed italic font-serif">"{product.description}"</p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 pt-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400 fill-mode-both">
                <div className="text-center md:text-left min-w-[200px]">
                  <p className="text-zinc-600 text-[9px] uppercase tracking-[0.3em] mb-1 font-cinzel">Investimento Membro</p>
                  <p className="text-5xl font-serif italic text-white">
                    {Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-white text-black hover:bg-[#c2410c] hover:text-white transition-all duration-500 py-7 rounded-full font-cinzel font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_20px_50px_rgba(194,65,12,0.3)] flex items-center justify-center gap-3"
                >
                  <ShoppingBag size={16} />
                  Adicionar à minha Adega
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
