import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

interface SummaryProps {
  subtotal: number;
  formatPrice: (v: number) => string;
  onShippingSelect: (quote: any | null) => void;
  onCepChange: (cep: string) => void;
  onFinalizar: () => void;
  loadingFinalizar: boolean;
}

export function CartSummary({ subtotal, formatPrice, onShippingSelect, onCepChange, onFinalizar, loadingFinalizar }: SummaryProps) {
  const { cart, cartCount } = useCart();
  const [cep, setCep] = useState(''); // Valor limpo para API
  const [displayCep, setDisplayCep] = useState(''); // Valor com máscara para o usuário
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any | null>(null);

  // ✅ INTEGRIDADE: Se mudar o carrinho, invalida o frete anterior
  useEffect(() => {
    setQuotes([]);
    setSelectedShipping(null);
    onShippingSelect(null);
  }, [cartCount, onShippingSelect]);

  // Cálculo do total geral
  const finalTotal = useMemo(() => {
    const shippingPrice = selectedShipping ? parseFloat(String(selectedShipping.price)) : 0;
    return subtotal + (isNaN(shippingPrice) ? 0 : shippingPrice);
  }, [subtotal, selectedShipping]);

  // Função para aplicar máscara de CEP
  const handleCepChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, ''); // Remove tudo que não é número
    setCep(cleanValue);
    onCepChange(cleanValue); // Já atualiza o pai com o valor limpo

    // Aplica a máscara 00000-000 para o input
    const masked = cleanValue.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    setDisplayCep(masked);

    // Se o CEP for alterado/deletado, resetamos as cotações
    if (cleanValue.length < 8) {
      setQuotes([]);
      setSelectedShipping(null);
      onShippingSelect(null);
    }
  };

  const handleCalculateShipping = useCallback(async () => {
    if (cep.length < 8) {
      alert('Por favor, informe um CEP válido.');
      return;
    }

    setLoadingShipping(true);

    try {
      const items = cart.map((item: any) => ({
        productId: String(item._id || item.id),
        quantity: item.quantity,
      }));

      const { data: response } = await api.post('/shipping/calculate', {
        cep: cep, // Envia o valor sem o traço
        items,
      });

      const availableQuotes = response.data?.quotes || response.quotes || response.data || [];

      if (Array.isArray(availableQuotes) && availableQuotes.length > 0) {
        setQuotes(availableQuotes);
      } else {
        alert('Nenhuma opção de entrega disponível para este pedido.');
      }
    } catch (error: any) {
      console.error('Erro no cálculo de frete:', error);
      alert(error.response?.data?.message || 'Servidor de frete indisponível no momento.');
    } finally {
      setLoadingShipping(false);
    }
  }, [cep, cart]);

  return (
    <aside className="bg-white/[0.02] p-8 rounded-[40px] border border-white/5 h-fit lg:sticky lg:top-44 backdrop-blur-xl shadow-2xl relative z-10 animate-in fade-in duration-700">
      <h3 className="font-cinzel text-[10px] text-zinc-500 uppercase tracking-[0.4em] mb-8">Resumo da Reserva</h3>

      <div className="space-y-6">
        {/* Subtotal */}
        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-500">
          <span>Subtotal de Itens</span>
          <span className="text-white font-medium">{formatPrice(subtotal)}</span>
        </div>

        {/* Input de CEP com Máscara */}
        <div className="pt-6 border-t border-white/5 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="00000-000"
              maxLength={9} // 8 números + 1 traço
              value={displayCep}
              onChange={(e) => handleCepChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-[#c2410c]/50 transition-all placeholder:text-zinc-700 font-mono"
            />
          </div>
          <button
            type="button"
            onClick={handleCalculateShipping}
            disabled={loadingShipping || cartCount === 0 || cep.length < 8}
            className="bg-[#c2410c] text-white text-[9px] uppercase font-black px-5 rounded-xl disabled:opacity-20 transition-all hover:bg-white hover:text-black"
          >
            {loadingShipping ? '...' : 'Calcular'}
          </button>
        </div>

        {/* Opções de Frete */}
        {quotes.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar animate-in slide-in-from-top-2 duration-500">
            {quotes.map((quote, idx) => {
              const companyName = typeof quote.company === 'object' ? quote.company.name : quote.company;
              const isSelected = selectedShipping?.name === quote.name && selectedShipping?.price === quote.price;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedShipping(quote);
                    onShippingSelect(quote);
                  }}
                  className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-all duration-300 ${
                    isSelected ? 'border-[#c2410c] bg-[#c2410c]/10' : 'border-white/5 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-white text-[9px] font-bold uppercase tracking-tight">
                      {String(companyName)} • {quote.name || quote.service}
                    </span>
                    <span className="text-zinc-500 text-[9px] italic">
                      Entrega em até {quote.delivery_time || quote.deadline_days || quote.deadline} dias
                    </span>
                  </div>
                  <span className="text-[#c2410c] text-xs font-bold">{formatPrice(parseFloat(String(quote.price)))}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Total Final */}
        <div className="flex justify-between items-end pt-8 border-t border-white/10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-zinc-500 tracking-widest mb-1">Total Geral</span>
            <span className="font-serif italic text-2xl text-[#c2410c]">Reserva</span>
          </div>
          <span className="text-4xl font-serif italic text-white tracking-tighter">{formatPrice(finalTotal)}</span>
        </div>

        {/* Botão de Finalização */}
        <button
          type="button"
          onClick={onFinalizar}
          disabled={!selectedShipping || loadingFinalizar || cartCount === 0}
          className="w-full mt-4 bg-[#c2410c] text-white font-cinzel text-[11px] tracking-[0.3em] uppercase py-6 rounded-full hover:bg-white hover:text-black transition-all disabled:opacity-10 shadow-[0_20px_50px_rgba(194,65,12,0.2)] active:scale-95"
        >
          {loadingFinalizar ? 'Processando Reserva...' : 'Confirmar e Finalizar'}
        </button>
      </div>
    </aside>
  );
}
