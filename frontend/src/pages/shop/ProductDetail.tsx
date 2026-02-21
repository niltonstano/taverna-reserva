import { ArrowLeft, Droplets, GlassWater, MapPin, ShoppingCart, Thermometer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';
import { FALLBACK_WINE_IMAGE, resolveWineImage } from '../../components/utils/wine-images';
import { useCart, useCartActions } from '../../context/CartContext';
import { api } from '../../services/api';

interface Vinho {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  image_url?: string;
  image?: string;
  uva?: string;
  origem?: string;
  safra?: string;
  pontuacao?: number;
  updatedAt?: string;
}

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart } = useCart();
  const { addToCart } = useCartActions();

  const [vinho, setVinho] = useState<Vinho | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdded = useMemo(() => {
    return cart.some((item) => String(item._id || (item as any).id) === id);
  }, [cart, id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    async function loadProduct() {
      try {
        setLoading(true);
        const response = await api.get(`/products/${id}?t=${Date.now()}`);
        const data = response.data?.data || response.data?.product || response.data;
        setVinho(data);
      } catch (error) {
        console.error('❌ Erro:', error);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id]);

  const productImage = useMemo(() => {
    if (!vinho) return FALLBACK_WINE_IMAGE;
    const path = resolveWineImage(vinho);
    const version = vinho.updatedAt ? new Date(vinho.updatedAt).getTime() : '1';
    return `${path}?v=${version}`;
  }, [vinho]);

  const handleButtonClick = () => {
    if (!vinho) return;
    if (!isAdded) {
      addToCart({ ...vinho, id: vinho._id, quantity: 1 } as any);
    } else {
      navigate('/cart');
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#c2410c] mb-6 shadow-[0_0_15px_rgba(194,65,12,0.5)]" />
        <p className="text-[#c2410c] font-serif italic text-2xl tracking-tighter">Decantando o rótulo...</p>
      </div>
    );

  if (!vinho) return null;

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/bg/adega1.webp" alt="" className="w-full h-full object-cover opacity-20 grayscale brightness-[0.4]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-32 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 hover:text-[#c2410c] transition-all mb-16"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-2 transition-transform" />
          Voltar para a Coleção
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#c2410c]/10 blur-[100px] rounded-full" />
            <div className="bg-zinc-900/40 border border-white/10 rounded-[80px] aspect-[4/5] flex items-center justify-center shadow-2xl relative backdrop-blur-2xl p-12 overflow-hidden group">
              <div className="absolute top-12 right-12 z-20">
                <div className="w-24 h-24 border border-[#c2410c]/30 rounded-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                  <span className="text-[#c2410c] font-serif italic text-3xl leading-none">{vinho.pontuacao || 95}</span>
                  <span className="text-[7px] text-zinc-500 uppercase font-black tracking-[0.3em] mt-2">Pontos</span>
                </div>
              </div>
              <img
                src={productImage}
                alt={vinho.name}
                className="h-full w-auto object-contain z-10 drop-shadow-[0_35px_50px_rgba(0,0,0,0.8)] transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_WINE_IMAGE;
                }}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <header className="space-y-6">
              <div className="px-5 py-2 w-fit bg-[#c2410c]/20 border border-[#c2410c]/30 rounded-full flex items-center gap-3">
                <MapPin size={12} className="text-[#c2410c]" />
                <span className="text-[#c2410c] font-black uppercase tracking-[0.3em] text-[10px]">{vinho.origem || 'Terroir Exclusivo'}</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif text-white italic tracking-tighter leading-tight">{vinho.name}</h1>
              <p className="text-zinc-400 font-serif leading-relaxed text-lg italic max-w-xl border-l-2 border-[#c2410c]/40 pl-6">
                {vinho.description || 'Uma curadoria exclusiva de aromas e paladar sofisticado selecionada para a Taverna Reserva.'}
              </p>
            </header>

            <div className="grid grid-cols-3 gap-4 py-10 my-10 border-y border-white/5">
              <DetailItem icon={<Droplets size={20} />} label="Casta" value={vinho.uva || 'Reserva'} />
              <DetailItem icon={<Thermometer size={20} />} label="Serviço" value="16°-18°C" isMiddle />
              <DetailItem icon={<GlassWater size={20} />} label="Safra" value={vinho.safra || '2021'} />
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-8">
              <div className="space-y-1">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.5em]">Investimento</p>
                <p className="text-5xl font-serif text-white tracking-tighter">
                  {Number(vinho.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <button
                onClick={handleButtonClick}
                className={`w-full sm:w-auto px-12 py-6 rounded-full font-cinzel font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 ${isAdded ? 'bg-white text-black hover:bg-[#c2410c] hover:text-white' : 'bg-[#c2410c] text-white hover:scale-105 active:scale-95 shadow-[#c2410c]/20 shadow-2xl'}`}
              >
                {isAdded ? (
                  <>
                    <ShoppingCart size={14} /> Finalizar Reserva
                  </>
                ) : (
                  'Adicionar à Adega'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function DetailItem({ icon, label, value, isMiddle = false }: any) {
  return (
    <div className={`text-center ${isMiddle ? 'border-x border-white/5' : ''}`}>
      <div className="text-[#c2410c]/60 flex justify-center mb-3">{icon}</div>
      <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">{label}</p>
      <p className="text-[10px] font-cinzel text-white uppercase tracking-widest truncate px-2">{value}</p>
    </div>
  );
}
