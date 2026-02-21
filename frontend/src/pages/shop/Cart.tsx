import { AlertCircle, ArrowLeft, Truck } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useCart, useCartActions } from '../../context/CartContext';
import { api } from '../../services/api';

// COMPONENTES E UTILS
import CartItemCard from '../../components/Cart/CartItemCard';
import { CartSummary } from '../../components/Cart/CartSummary';
import { CheckoutSection } from '../../components/ui/CheckoutSection';
import { Input } from '../../components/ui/Input';
import { resolveWineImage } from '../../components/utils/wine-images';

const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getCleanPrice = (p: any): number => {
  if (typeof p === 'number') return p;
  return (
    parseFloat(
      String(p || 0)
        .replace(/[R$\s.]/g, '')
        .replace(',', '.'),
    ) || 0
  );
};

export function Cart() {
  const navigate = useNavigate();
  const { cart, cartCount } = useCart();
  const { clearCart, updateQuantity, removeFromCart } = useCartActions();

  // ESTADOS LOCAIS
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [selectedShipping, setSelectedShipping] = useState<any | null>(null);

  // CÁLCULO DE SUBTOTAL
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = getCleanPrice(item.price || (item as any).preco);
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  // FUNÇÃO PRINCIPAL: FINALIZAR RESERVA
  const handleFinalizar = useCallback(async () => {
    if (cart.length === 0 || loading) return;

    // Recupera usuário para validação
    const userData = localStorage.getItem('@Taverna:user');
    const user = userData ? JSON.parse(userData) : null;
    const userId = user?.id || user?._id;

    if (!userId) {
      return navigate('/login', { state: { from: '/cart' } });
    }

    // Validação de Frete e Endereço
    if (!selectedShipping || !endereco.trim()) {
      setErrorDetails('📍 Por favor, informe o endereço completo e selecione uma opção de frete.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setErrorDetails(null);

    try {
      const sPrice = parseFloat(String(selectedShipping.price || 0));
      const totalGeral = Number((subtotal + sPrice).toFixed(2));
      const iKey = uuidv4();

      // Payload para o Backend (Fastify)
      const payload = {
        address: endereco.trim(),
        zipCode: cep.replace(/\D/g, ''),
        total: totalGeral,
        shipping: {
          service: String(selectedShipping.name),
          price: sPrice,
          deadline: Number(selectedShipping.delivery_range?.max || selectedShipping.deadline || 5),
          company:
            typeof selectedShipping.company === 'object' ? selectedShipping.company.name : String(selectedShipping.company || 'Transportadora'),
        },
        items: cart.map((i) => ({
          productId: String(i._id || (i as any).id),
          quantity: Number(i.quantity),
        })),
      };

      const response = await api.post('/checkout/process', payload, {
        headers: { 'idempotency-key': iKey },
      });

      const orderData = response.data.order || response.data.data;
      const shortId = orderData?._id?.slice(-6).toUpperCase() || 'RESERVA';

      // Link do WhatsApp com os dados da reserva (Ajuste o número da sua adega aqui)
      const msg = `*NOVA RESERVA - TAVERNA*%0A*ID:* #${shortId}%0A*Total:* ${formatPrice(totalGeral)}%0A%0A*Membro:* ${user.name}`;
      const whatsappUrl = `https://wa.me/5511999999999?text=${msg}`;

      clearCart();
      navigate('/success', { state: { whatsappUrl, orderId: shortId } });
    } catch (error: any) {
      console.error('Erro no Checkout:', error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      setErrorDetails(serverMsg || 'Falha ao processar reserva. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [cart, selectedShipping, endereco, cep, subtotal, navigate, clearCart, loading]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-x-hidden">
      {/* BG ESTILIZADO */}
      <div className="fixed inset-0 z-0">
        <img src="/bg/adega3.webp" className="w-full h-full object-cover opacity-20 grayscale" alt="Background Taverna" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 w-full">
        {/* VOLTAR */}
        <button
          onClick={() => navigate('/catalog')}
          className="group flex items-center gap-3 text-zinc-500 hover:text-[#c2410c] mb-12 uppercase text-[9px] tracking-[0.5em] font-cinzel transition-all"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
          Voltar ao Catálogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* COLUNA ESQUERDA */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="font-serif italic text-7xl mb-2">
                Sua <span className="text-[#c2410c]">Adega</span>
              </h2>
              <p className="text-zinc-500 font-cinzel text-[10px] tracking-[0.3em] uppercase">Seleção de Rótulos Exclusivos</p>
            </div>

            <div className="space-y-4">
              {cart.map((item) => (
                <CartItemCard
                  key={String(item._id || (item as any).id)}
                  item={{
                    ...item,
                    image_url: resolveWineImage(item),
                  }}
                  onUpdate={updateQuantity}
                  onRemove={removeFromCart}
                  formatPrice={formatPrice}
                  getCleanPrice={getCleanPrice}
                />
              ))}

              {cartCount === 0 && (
                <div className="text-center py-24 border border-white/5 bg-white/[0.01] rounded-[40px] text-zinc-500 italic font-serif text-xl animate-pulse">
                  Sua adega está vazia.
                </div>
              )}
            </div>

            {cartCount > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <CheckoutSection
                  title="Entrega"
                  subtitle="Endereço de destino da sua curadoria"
                  icon={<Truck size={20} className="text-[#c2410c]" />}
                >
                  <div className="bg-white/[0.02] p-10 rounded-[40px] border border-white/10 space-y-6">
                    <Input
                      label="Endereço de Entrega"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Ex: Rua das Videiras, 123 - Centro, São Paulo"
                      className="bg-black/40 border-white/10 focus:border-[#c2410c]/50 transition-all"
                    />
                    <p className="text-[10px] text-zinc-600 font-cinzel uppercase tracking-[0.2em]">
                      * Informe o CEP ao lado para calcular as opções de frete disponíveis.
                    </p>
                  </div>
                </CheckoutSection>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA (RESUMO) */}
          <aside className="relative">
            <div className="sticky top-32 space-y-6">
              <CartSummary
                subtotal={subtotal}
                formatPrice={formatPrice}
                loadingFinalizar={loading}
                onFinalizar={handleFinalizar}
                onCepChange={setCep}
                onShippingSelect={setSelectedShipping}
              />

              {errorDetails && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in slide-in-from-right-4 duration-300">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-500 text-[11px] leading-relaxed font-medium">{errorDetails}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
