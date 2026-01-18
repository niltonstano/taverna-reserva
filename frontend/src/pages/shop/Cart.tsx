import { ArrowLeft, Truck } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SuccessModal } from '../../components/checkout/SuccessModal';
import { Footer } from '../../components/common/Footer';
import { CheckoutSection } from '../../components/ui/CheckoutSection';
import { Input } from '../../components/ui/Input';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

// Subcomponentes
import { CartItemCard } from '../../components/Cart/CartItemCard';
import { CartSummary } from '../../components/Cart/CartSummary';

// Funções Auxiliares de Formatação
const getCleanPrice = (preco: any): number => {
  if (!preco) return 0;
  if (typeof preco === 'number') return preco;
  const clean = String(preco)
    .replace(/[R$\s.]/g, '')
    .replace(',', '.');
  return parseFloat(clean) || 0;
};

const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Cart() {
  const { cart, clearCart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  // Estados
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [frete, setFrete] = useState<{ valor: number; prazo: string } | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // Cálculos de Totais
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = getCleanPrice(item.price || item.preco || (item as any).price);
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  const totalGeral = subtotal + (frete?.valor || 0);

  // Handlers
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCep(value);

    if (value.length === 8) {
      const isGratis = Number(value) % 2 === 0;
      setFrete({
        valor: isGratis ? 0 : 45,
        prazo: isGratis ? '2-4 dias' : '5-7 dias',
      });
    } else {
      setFrete(null);
    }
  };

  /**
   * ✅ FUNÇÃO FINALIZAR COMPRA
   * Sincroniza com o banco e abre o modal de sucesso com WhatsApp
   */
  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas antes de processar
    if (cart.length === 0 || loading) return;

    const savedUser = localStorage.getItem('@Taverna:user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    const userEmail = user?.email;

    if (!userEmail) {
      alert('Por favor, realize o login para finalizar sua reserva.');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // 1. SINCRONIZAÇÃO COM BACKEND
      await api.delete('/cart/clear');

      const syncPromises = cart.map((item) =>
        api.post('/cart/items', {
          productId: item.id || item._id || (item as any)._id,
          quantity: item.quantity,
        }),
      );
      await Promise.all(syncPromises);

      // 2. REGISTRO DO PEDIDO/CHECKOUT
      const idempotencyKey = window.crypto.randomUUID();
      const payload = {
        email: userEmail,
        idempotencyKey: idempotencyKey,
      };

      await api.post('/orders/checkout', payload, {
        headers: {
          'idempotency-key': idempotencyKey,
        },
      });

      // 3. PREPARAÇÃO DO WHATSAPP
      const itensMsg = cart.map((i) => `• ${i.quantity}x ${i.name || i.nome}`).join('%0A');
      const msg =
        `*NOVA RESERVA - TAVERNA*%0A%0A` +
        `*Cliente:* ${user.name || 'Membro'}%0A` +
        `*Itens:*%0A${itensMsg}%0A%0A` +
        `*Total:* ${formatPrice(totalGeral)}%0A` +
        `*Local:* ${endereco || 'Retirada na Adega'}%0A` +
        `*CEP:* ${cep || 'N/A'}`;

      // Configura a URL e abre o modal de sucesso
      setWhatsappUrl(`https://wa.me/5511999999999?text=${msg}`);
      setIsSuccess(true);

      // 4. LIMPEZA DO CARRINHO LOCAL
      clearCart();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao processar reserva.';
      console.error('❌ Erro no Checkout:', error.response?.data || error.message);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {/* BACKGROUND IMERSIVO */}
      <div className="fixed inset-0 z-0">
        <img src="/bg/adega1.webp" className="w-full h-full object-cover grayscale opacity-[0.12] brightness-125" alt="Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#c2410c]/10 blur-[150px] rounded-full opacity-30" />
      </div>

      <SuccessModal isOpen={isSuccess} whatsappUrl={whatsappUrl} />

      <div className="max-w-7xl mx-auto px-6 pt-44 pb-24 relative z-10 flex-grow w-full">
        <button
          onClick={() => navigate('/catalog')}
          className="group flex items-center gap-3 text-zinc-500 hover:text-[#c2410c] mb-12 uppercase text-[10px] tracking-[0.6em] font-cinzel transition-all animate-in fade-in slide-in-from-left-4 duration-700"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-2 transition-transform" />
          Continuar Explorando
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
              <header className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <h2 className="font-serif italic text-5xl mb-4 leading-none tracking-tighter">
                  Sua <span className="text-[#c2410c]">Reserva</span>
                </h2>
                <div className="h-[1px] w-24 bg-gradient-to-r from-[#c2410c]/50 to-transparent" />
              </header>

              {cart.length === 0 ? (
                <div className="py-24 text-center border border-white/5 rounded-[40px] bg-white/[0.02] backdrop-blur-md flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-700">
                  <p className="text-zinc-500 font-cinzel text-[11px] uppercase tracking-widest">Sua adega está vazia no momento.</p>
                  <button
                    onClick={() => navigate('/catalog')}
                    className="text-[#c2410c] text-[10px] font-black uppercase border-b border-[#c2410c] pb-1 hover:text-white hover:border-white transition-colors"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div
                      key={String(item.id || item._id || (item as any)._id)}
                      style={{ animationDelay: `${index * 100}ms` }}
                      className="animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-both"
                    >
                      <CartItemCard
                        item={item}
                        onUpdate={updateQuantity}
                        onRemove={removeFromCart}
                        formatPrice={formatPrice}
                        getCleanPrice={getCleanPrice}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {cart.length > 0 && (
              <form
                onSubmit={handleFinalizar}
                className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both"
              >
                <CheckoutSection title="Entrega" subtitle="Logística Exclusiva Taverna" icon={<Truck className="text-[#c2410c]" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="CEP" value={cep} onChange={handleCepChange} maxLength={8} placeholder="00000000" />
                    <Input
                      label="Endereço Completo"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Rua, número, bairro..."
                    />
                  </div>
                  {frete && (
                    <div className="mt-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest flex justify-between">
                      <span>Prazo Estimado: {frete.prazo}</span>
                      <span>Frete: {frete.valor === 0 ? 'Grátis' : formatPrice(frete.valor)}</span>
                    </div>
                  )}
                </CheckoutSection>

                {/* BOTÃO LIBERADO PARA FINALIZAR */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#c2410c] py-8 rounded-full font-cinzel font-black uppercase tracking-widest text-[11px] hover:bg-white hover:text-black transition-all duration-500 disabled:bg-zinc-800 disabled:text-zinc-500 shadow-2xl shadow-orange-950/20 active:scale-[0.98]"
                >
                  {loading ? 'Processando Reserva...' : `Confirmar Reserva • ${formatPrice(totalGeral)}`}
                </button>
              </form>
            )}
          </div>

          <aside className="lg:col-span-1 animate-in fade-in slide-in-from-left-8 duration-1000 delay-500 fill-mode-both">
            <CartSummary subtotal={subtotal} frete={frete?.valor || 0} total={totalGeral} formatPrice={formatPrice} />
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
