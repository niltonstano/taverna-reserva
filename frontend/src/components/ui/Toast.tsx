import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: {
      bg: 'bg-emerald-950/90',
      border: 'border-emerald-500/50',
      icon: <CheckCircle2 className="text-emerald-400" size={18} />,
      text: 'text-emerald-100',
    },
    error: {
      bg: 'bg-red-950/90',
      border: 'border-red-500/50',
      icon: <AlertCircle className="text-red-400" size={18} />,
      text: 'text-red-100',
    },
    info: {
      bg: 'bg-zinc-900/95',
      border: 'border-[#c2410c]/50',
      icon: <Info className="text-[#c2410c]" size={18} />,
      text: 'text-zinc-100',
    },
  };

  return (
    <div
      className={`fixed bottom-8 right-8 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-500 ${styles[type].bg} ${styles[type].border}`}
    >
      {styles[type].icon}
      <p className={`font-serif italic text-sm ${styles[type].text}`}>{message}</p>
      <button onClick={onClose} className="ml-4 text-white/20 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
