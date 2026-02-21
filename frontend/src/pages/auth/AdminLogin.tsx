import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn({ email, password });
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Acesso administrativo negado.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c2410c]/10 rounded-full blur-[120px] z-0" />

      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full space-y-8 bg-white/[0.02] backdrop-blur-xl p-10 rounded-[40px] border border-white/5 shadow-2xl z-10 relative"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#c2410c]/10 border border-[#c2410c]/20 rounded-2xl flex items-center justify-center text-[#c2410c] mb-2">
              <ShieldCheck size={32} />
            </div>
          </div>
          <h2 className="text-4xl font-serif italic text-white tracking-tight">
            Painel do <span className="text-[#c2410c]">Curador</span>
          </h2>
          <p className="text-zinc-500 text-[9px] uppercase tracking-[0.4em]">Autenticação Administrativa</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold uppercase p-4 rounded-2xl text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input
              type="email"
              placeholder="E-MAIL INSTITUCIONAL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/5 py-5 pl-14 pr-6 rounded-2xl text-[10px] outline-none focus:border-[#c2410c] text-white transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input
              type="password"
              placeholder="CHAVE DE ACESSO"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/5 py-5 pl-14 pr-6 rounded-2xl text-[10px] outline-none focus:border-[#c2410c] text-white transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group w-full bg-[#c2410c] text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              Entrar na Adega <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
