import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <div className="space-y-2 w-full">
      {label && <label className="text-[10px] font-cinzel text-zinc-500 tracking-[0.2em] uppercase ml-4">{label}</label>}
      <input
        {...props}
        className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl p-5 text-sm outline-none 
                   focus:border-[#c2410c]/40 text-white transition-all placeholder:text-zinc-800 font-serif italic"
      />
    </div>
  );
}
