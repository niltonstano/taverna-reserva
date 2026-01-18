// --- SUMMARY COMPONENT ---

interface SummaryProps {
  subtotal: number;
  frete: number;
  total: number;
  formatPrice: (v: number) => string;
}

export function CartSummary({ subtotal, frete, total, formatPrice }: SummaryProps) {
  return (
    <aside className="bg-zinc-900/30 p-10 rounded-[40px] border border-white/5 h-fit lg:sticky lg:top-32 backdrop-blur-xl">
      <h3 className="font-cinzel text-[9px] text-zinc-500 uppercase tracking-[0.4em] mb-10 border-b border-white/5 pb-4">Resumo da Reserva</h3>
      <div className="space-y-5">
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500">
          <span>Subtotal</span>
          <span className="text-white">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500">
          <span>Logística (Frete)</span>
          <span className="text-white">{frete > 0 ? formatPrice(frete) : 'Cortesia'}</span>
        </div>
        <div className="flex justify-between items-end pt-6 border-t border-white/10">
          <span className="font-serif italic text-2xl text-[#c2410c]">Total</span>
          <span className="text-4xl font-serif italic tracking-tighter text-white">{formatPrice(total)}</span>
        </div>
      </div>
    </aside>
  );
}
