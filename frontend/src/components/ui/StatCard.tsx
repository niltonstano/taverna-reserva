// O segredo está no 'type LucideIcon' para satisfazer o verbatimModuleSyntax
import { AlertCircle, TrendingUp, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  alert?: boolean;
  // Aqui usamos o tipo que importamos acima
  icon: LucideIcon;
}

export function StatCard({ title, value, trend, alert, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] hover:bg-white/[0.04] transition-all">
      <div className="flex justify-between items-start mb-6">
        {/* O Icon aqui é o componente que passamos por prop */}
        <div className="p-3 bg-[#c2410c]/10 rounded-2xl">
          <Icon size={20} className="text-[#c2410c]" />
        </div>

        {alert ? <AlertCircle size={18} className="text-red-500 animate-pulse" /> : <TrendingUp size={18} className="text-emerald-500/50" />}
      </div>

      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">{title}</p>
        <p className="text-3xl font-serif italic text-white">{value}</p>
        {trend && <p className="text-[10px] text-zinc-600 mt-2 font-medium italic">{trend}</p>}
      </div>
    </div>
  );
}
