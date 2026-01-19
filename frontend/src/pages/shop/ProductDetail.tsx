import { ArrowLeft, Droplets, GlassWater, MapPin, ShoppingCart, Thermometer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

interface Vinho {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  image?: string;
  uva?: string;
  origem?: string;
  safra?: string;
  pontuacao?: number;
}

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [vinho, setVinho] = useState<Vinho | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    async function loadProduct() {
      try {
        setLoading(true);
        const response = await api.get(`/products/${id}`);
        const data = response.data.data || response.data.product || response.data;
        setVinho(data);
      } catch (error) {
        console.error('Erro ao carregar o vinho:', error);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id]);

  const handleButtonClick = () => {
    if (!vinho) return;
    if (!added) {
      addToCart({ ...vinho, id: vinho._id, quantity: 1 } as any);
      setAdded(true);
    } else {
      navigate('/cart');
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#c2410c] mr-4"></div>
        <div className="text-[#c2410c] font-serif italic text-2xl">Consultando o sommelier...</div>
      </div>
    );

  if (!vinho)
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl font-serif text-white italic mb-4">Rótulo Indisponível</h2>
        <button onClick={() => navigate('/catalog')} className="text-[#c2410c] border-b border-[#c2410c] pb-2 uppercase tracking-widest text-[10px]">
          Voltar para a Adega
        </button>
      </div>
    );

  const productImage = vinho.image_url || vinho.image || '/vinhos/rioja.webp';

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-x-hidden">
      {/* 🖼️ BACKGROUND DECORATIVO FIXO */}
      {/* Usamos z-0 aqui e z-10 no conteúdo para garantir que nada do CSS global (body/html) esconda a imagem */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/bg/adega1.webp" alt="Background Adega" className="w-full h-full object-cover opacity-25 grayscale brightness-[0.5]" />
        {/* Máscaras de profundidade para garantir leitura */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505] opacity-80" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-32 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 hover:text-[#c2410c] transition-all mb-16"
        >
          <ArrowLeft size={14} /> Voltar para a Coleção
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* LADO ESQUERDO: GARRAFA */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#c2410c]/10 blur-[100px] rounded-full" />
            <div className="bg-zinc-900/40 border border-white/10 rounded-[80px] aspect-[4/5] flex items-center justify-center shadow-2xl relative backdrop-blur-2xl">
              <div className="absolute top-12 right-12 z-20">
                <div className="w-28 h-28 border border-[#c2410c]/30 rounded-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                  <span className="text-[#c2410c] font-serif italic text-4xl leading-none">{vinho.pontuacao || 95}</span>
                  <span className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.3em] mt-2">Pontos</span>
                </div>
              </div>
              <img
                src={productImage}
                alt={vinho.name}
                className="h-[85%] w-auto object-contain z-10 drop-shadow-[0_45px_65px_rgba(0,0,0,0.9)] transition-transform duration-700 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/vinhos/rioja.webp';
                }}
              />
            </div>
          </div>

          {/* LADO DIREITO: INFO */}
          <div className="flex flex-col">
            <header className="space-y-8">
              <div className="px-5 py-2 w-fit bg-[#c2410c]/20 border border-[#c2410c]/30 rounded-full flex items-center gap-3">
                <MapPin size={12} className="text-[#c2410c]" />
                <span className="text-[#c2410c] font-black uppercase tracking-[0.3em] text-[10px]">{vinho.origem || 'Terroir Exclusivo'}</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif text-white italic tracking-tighter leading-tight">{vinho.name}</h1>
              <p className="text-zinc-300 font-serif leading-relaxed text-xl italic max-w-xl border-l-2 border-[#c2410c]/40 pl-8">
                {vinho.description || 'Uma experiência sensorial única reservada para os melhores momentos.'}
              </p>
            </header>

            <div className="grid grid-cols-3 gap-8 py-12 my-12 border-y border-white/10">
              <div className="text-center">
                <Droplets size={24} className="text-[#c2410c]/60 mx-auto mb-4" />
                <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">Casta</p>
                <p className="text-xs font-cinzel text-white uppercase tracking-widest">{vinho.uva || 'Blend'}</p>
              </div>
              <div className="text-center border-x border-white/10">
                <Thermometer size={24} className="text-[#c2410c]/60 mx-auto mb-4" />
                <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">Serviço</p>
                <p className="text-xs font-cinzel text-white uppercase tracking-widest">16° - 18°C</p>
              </div>
              <div className="text-center">
                <GlassWater size={24} className="text-[#c2410c]/60 mx-auto mb-4" />
                <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">Safra</p>
                <p className="text-xs font-cinzel text-white uppercase tracking-widest">{vinho.safra || 'Reserva'}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-12 pt-4">
              <div className="space-y-2">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em]">Valor de Investimento</p>
                <p className="text-6xl font-serif text-white tracking-tighter">
                  {Number(vinho.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <button
                onClick={handleButtonClick}
                className={`w-full sm:w-auto px-16 py-8 rounded-full font-cinzel font-black text-[11px] uppercase tracking-[0.4em] transition-all duration-500 shadow-2xl flex items-center justify-center gap-3 ${
                  added
                    ? 'bg-white text-black hover:bg-[#c2410c] hover:text-white'
                    : 'bg-[#c2410c] text-white hover:bg-white hover:text-black active:scale-95'
                }`}
              >
                {added && <ShoppingCart size={16} />}
                {added ? 'Ir para o Carrinho' : 'Adicionar ao Carrinho'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
