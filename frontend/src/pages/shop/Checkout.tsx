import { ArrowLeft, CreditCard, Truck } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuccessModal } from '../../components/checkout/SuccessModal';
import { CheckoutSection } from '../../components/ui/CheckoutSection';
import { Input } from '../../components/ui/Input';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

export function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [frete, setFrete] = useState<{ valor: number; prazo: string } | null>(null);

  const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getCleanPrice = (preco: any): number => {
    if (!preco) return 0;
    if (typeof preco === 'number') return preco;
    const clean = String(preco)
      .replace(/[R$\s.]/g, '')
      .replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCep(value);
    if (value.length === 8) {
      const isGratis = Number(value) % 2 === 0;
      setFrete({
        valor: isGratis ? 0 : 45,
        prazo: isGratis ? '2-4 dias úteis' : '5-7 dias úteis',
      });
    }
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + getCleanPrice(item.preco || item.price) * (item.quantity || 1), 0);
  }, [cart]);

  const totalGeral = subtotal + (frete?.valor || 0);

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || loading) return;
    setLoading(true);

    try {
      // ✅ 1. Sincroniza com o Backend
      await api.post('/orders/checkout', {
        address: endereco,
        zipCode: cep,
        items: cart.map((i) => ({ productId: i._id || i.id, quantity: i.quantity })),
        total: totalGeral,
      });

      // ✅ 2. Gera URL do WhatsApp
      const itensMsg = cart.map((item) => `• ${item.quantity}x ${item.nome || item.name}`).join('%0A');
      const msg = `*NOVA RESERVA - TAVERNA*%0A%0A*Itens:*%0A${itensMsg}%0A%0A*Total:* ${formatPrice(totalGeral)}%0A*Entrega:* ${cep}`;
      setWhatsappUrl(`https://wa.me/5511999999999?text=${msg}`);

      // ✅ 3. Finaliza
      setIsSuccess(true);
      clearCart();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao processar reserva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] relative text-white pt-32 pb-32 px-6">
      <SuccessModal isOpen={isSuccess} whatsappUrl={whatsappUrl} />

      <div className="max-w-7xl mx-auto relative z-10">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-3 text-zinc-500 hover:text-[#c2410c] font-cinzel text-[10px] uppercase mb-12 tracking-[0.3em]"
        >
          <ArrowLeft size={14} /> Voltar ao Carrinho
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <form onSubmit={handleFinalizar} className="lg:col-span-2 space-y-12">
            <CheckoutSection title="Entrega" subtitle="Logística" icon={<Truck className="text-[#c2410c]" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="CEP" placeholder="00000-000" value={cep} onChange={handleCepChange} required maxLength={9} />
                <div className="flex items-end pb-3">
                  {frete && (
                    <span className="text-[10px] font-cinzel text-[#c2410c]">
                      {frete.valor === 0 ? 'Frete Grátis' : `Frete: ${formatPrice(frete.valor)}`}
                    </span>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Endereço"
                    required
                    placeholder="Rua, número, bairro..."
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>
              </div>
            </CheckoutSection>

            <CheckoutSection title="Pagamento" subtitle="WhatsApp Business" icon={<CreditCard className="text-[#c2410c]" />}>
              <div className="bg-[#c2410c]/5 border border-[#c2410c]/20 p-8 rounded-[32px] flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-[#c2410c] shadow-[0_0_10px_#c2410c]" />
                <span className="font-cinzel text-[10px] tracking-widest uppercase">Concluir com Sommelier</span>
              </div>
            </CheckoutSection>

            <button
              type="submit"
              disabled={!frete || loading}
              className="w-full bg-[#c2410c] text-black font-cinzel font-black py-8 rounded-full uppercase tracking-widest text-[11px] hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {loading ? 'Processando...' : `Confirmar Reserva • ${formatPrice(totalGeral)}`}
            </button>
          </form>

          <aside className="bg-zinc-900/30 p-10 rounded-[40px] border border-white/5 h-fit sticky top-32 backdrop-blur-xl">
            <h3 className="font-cinzel text-[9px] text-zinc-500 uppercase tracking-[0.4em] mb-10 border-b border-white/5 pb-4">Itens</h3>
            <div className="space-y-6 mb-12">
              {cart.map((item) => (
                <div key={item._id || item.id} className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="font-serif italic text-lg leading-none">{item.nome || item.name}</span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{item.quantity} un.</span>
                  </div>
                  <span className="text-[#c2410c] font-cinzel text-[10px]">{formatPrice(getCleanPrice(item.preco || item.price))}</span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
              <span className="font-serif italic text-2xl text-[#c2410c]">Total</span>
              <span className="text-4xl font-serif italic">{formatPrice(totalGeral)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
