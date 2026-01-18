import React from 'react';

interface CheckoutSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function CheckoutSection({ title, subtitle, icon, children }: CheckoutSectionProps) {
  return (
    <section className="bg-zinc-900/40 border border-white/5 p-10 rounded-[40px] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-[#c2410c]/10 rounded-2xl text-[#c2410c]">{icon}</div>
        <div>
          <h3 className="font-cinzel text-xs tracking-[0.3em] text-white uppercase font-black">{title}</h3>
          <p className="text-zinc-500 font-serif italic text-xs">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
