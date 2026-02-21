import { ArrowLeft, CreditCard, Search, Truck, User } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks e Serviços
import { useCart } from '../../context/CartContext';
import { useCartActions } from '../../hooks/useCartActions';
import { api } from '../../services/api';

// Componentes de UI
import { SuccessModal } from '../../components/checkout/SuccessModal';
import { CheckoutSection } from '../../components/ui/CheckoutSection';
import { Input } from '../../components/ui/Input';

// Types
import type { ShippingQuote } from '../../types/shipping';

export function Checkout() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { clearCart } = useCartActions();

  // --- ESTADOS DE CONTROLE ---
  const [loading, setLoading] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [selectedShipping, setSelectedShipping] = useState<ShippingQuote | null>(null);

  // Estados para o Modal de Sucesso
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderInfo, setOrderInfo] = useState({ id: '', url: '' });

  // --- MÉTODOS AUXILIARES ---
  const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getSafePrice = (price: any): number => {
    if (typeof price === 'number') return price;
    return (
      parseFloat(
        String(price)
          .replace(/[R$\s.]/g, '')
          .replace(',', '.'),
      ) || 0
    );
  };

  // --- LÓGICA DE FRETE ---
  const handleCalculateShipping = async () => {
    if (cep.length !== 8) return;
    setCalculatingShipping(true);
    try {
      const { data } = await api.post('/shipping/calculate', { cep });
      const quotes = data.data?.quotes || data.quotes || [];
      if (quotes.length > 0) setSelectedShipping(quotes[0]);
    } catch (error) {
      console.error('Erro frete:', error);
      alert('Não foi possível calcular o frete para este CEP.');
    } finally {
      setCalculatingShipping(false);
    }
  };

  // --- CÁLCULOS ---
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + getSafePrice(item.price) * item.quantity, 0), [cart]);
  const totalGeral = subtotal + (selectedShipping?.price || 0);

  // --- FINALIZAÇÃO CORRIGIDA COM SEU LOG ---
  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || loading || !selectedShipping) return;
    setLoading(true);

    try {
      // Usando a rota que apareceu no seu Log de Rede
      const { data } = await api.post('/checkout/process', {
        address: endereco,
        zipCode: cep,
        items: cart.map((i) => ({ productId: i._id, quantity: i.quantity })),
        shipping: {
          service: selectedShipping.service,
          company: selectedShipping.company,
          price: selectedShipping.price,
          deadline: selectedShipping.deadline_days,
        },
        total: totalGeral,
      });

      // MAPEAMENTO SEGURO (Baseado no seu JSON de retorno)
      // O seu servidor envia 'id' dentro de 'order' e 'ticket_url' na raiz do objeto
      const orderId = data.order?.id || 'TAV-SUCCESS';
      const whatsappUrl = data.ticket_url || `https://wa.me/5511999999999?text=Reserva ${orderId}`;

      // 1. Atualiza as informações do pedido para o modal
      setOrderInfo({ id: orderId, url: whatsappUrl });

      // 2. Dispara a abertura do Modal
      setIsModalOpen(true);

      // 3. Limpa o carrinho local
      await clearCart();
    } catch (error: any) {
      console.error('Erro no Checkout:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao processar reserva.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-32 px-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-3 text-zinc-500 hover:text-[#c2410c] font-cinzel text-[10px] uppercase mb-12 tracking-[0.3em] transition-all"
        >
          <ArrowLeft size={14} /> Voltar ao Carrinho
        </button>

        <header className="mb-16">
          <h1 className="font-serif italic text-6xl mb-4 text-white">
            Finalizar <span className="text-[#c2410c]">Reserva.</span>
          </h1>
          <p className="text-zinc-500 max-w-md">Confirme os detalhes para a entrega técnica da sua coleção.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <form onSubmit={handleFinalizar} className="lg:col-span-2 space-y-8">
            {/* 1. Identificação */}
            <CheckoutSection title="Identificação" subtitle="Dados do Titular" icon={<User size={20} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nome Completo" placeholder="Nome para o certificado" required />
                <Input label="WhatsApp" placeholder="(11) 99999-9999" required />
              </div>
            </CheckoutSection>

            {/* 2. Entrega e Logística */}
            <CheckoutSection title="Entrega" subtitle="Logística Premium" icon={<Truck size={20} />}>
              <div className="space-y-6">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Input
                      label="CEP"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => setCep(e.target.value.replace(/\D/g, ''))}
                      maxLength={8}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCalculateShipping}
                    disabled={calculatingShipping || cep.length < 8}
                    className="bg-white/5 border border-white/10 hover:border-[#c2410c] h-[58px] px-8 rounded-2xl transition-all flex items-center justify-center disabled:opacity-20"
                  >
                    {calculatingShipping ? (
                      <div className="w-5 h-5 border-2 border-[#c2410c] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search size={20} />
                    )}
                  </button>
                </div>

                {selectedShipping && (
                  <div className="p-4 bg-[#c2410c]/10 border border-[#c2410c]/20 rounded-2xl animate-in fade-in zoom-in-95">
                    <p className="text-[#c2410c] font-cinzel text-[10px] uppercase tracking-widest">Transportadora: {selectedShipping.company}</p>
                    <p className="text-zinc-400 text-xs">
                      Prazo: {selectedShipping.deadline_days} dias úteis • {formatPrice(selectedShipping.price)}
                    </p>
                  </div>
                )}

                <Input
                  label="Endereço Completo"
                  placeholder="Rua, número, complemento..."
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  required
                />
              </div>
            </CheckoutSection>

            {/* 3. Pagamento */}
            <CheckoutSection title="Pagamento" subtitle="Venda Consultiva" icon={<CreditCard size={20} />}>
              <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl text-zinc-500 text-sm italic">
                O acerto financeiro será realizado diretamente com nosso sommelier via canal seguro no WhatsApp.
              </div>
            </CheckoutSection>

            <button
              type="submit"
              disabled={!selectedShipping || loading || cart.length === 0}
              className="w-full bg-[#c2410c] hover:bg-[#9a3412] text-black font-cinzel font-black py-8 rounded-[30px] uppercase tracking-[0.4em] text-[11px] transition-all disabled:opacity-10 shadow-2xl shadow-[#c2410c]/20"
            >
              {loading ? 'Sincronizando Adega...' : `Eternizar Reserva • ${formatPrice(totalGeral)}`}
            </button>
          </form>

          {/* Resumo Lateral */}
          <aside className="lg:col-span-1">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-10 rounded-[40px] sticky top-32">
              <h3 className="font-cinzel text-[10px] text-zinc-500 uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Sua Seleção</h3>

              <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between items-start">
                    <div>
                      <p className="font-serif italic text-lg leading-tight">{item.name}</p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{item.quantity} UN</p>
                    </div>
                    <span className="text-[#c2410c] font-cinzel text-[10px]">{formatPrice(getSafePrice(item.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                  <span>Frete</span>
                  <span className="text-white">{selectedShipping ? formatPrice(selectedShipping.price) : 'A calcular'}</span>
                </div>
                <div className="flex justify-between items-end pt-6">
                  <span className="font-serif italic text-2xl text-[#c2410c]">Total</span>
                  <span className="text-4xl font-serif italic text-white tracking-tighter leading-none">{formatPrice(totalGeral)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* MODAL DE SUCESSO - DEVE ESTAR AQUI PARA FUNCIONAR */}
      <SuccessModal
        isOpen={isModalOpen}
        whatsappUrl={orderInfo.url}
        orderId={orderInfo.id}
        onClose={() => {
          setIsModalOpen(false);
          navigate('/catalog');
        }}
      />
    </div>
  );
}
