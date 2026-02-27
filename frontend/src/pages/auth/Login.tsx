import { Eye, EyeOff, Loader2, LogIn, UserPlus } from 'lucide-react'; // Adicionado Eye e EyeOff
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ✅ Estado para o olhinho
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden">
      {/* Background fixo */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/bg/adega1.webp" className="w-full h-full object-cover opacity-[0.15] grayscale" alt="Background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)]" />
      </div>

      {/* Conteúdo Centralizado */}
      <div className="flex-grow flex items-center justify-center px-6 py-20 relative z-10">
        <div className="max-w-md w-full">
          <div className="bg-black/60 border border-white/10 p-10 rounded-[40px] backdrop-blur-3xl shadow-2xl">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-serif italic text-white mb-2">
                Membro <span className="text-[#c2410c]">Taverna</span>
              </h1>
              <p className="text-zinc-500 italic">Acesse sua adega exclusiva</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs text-center animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <input
                type="email"
                placeholder="E-mail"
                required
                className="w-full bg-white/5 border border-white/10 py-4 px-6 rounded-full text-white placeholder:text-zinc-600 focus:border-[#c2410c] transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* ✅ Campo de Senha com Olhinho */}
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'} // Alterna entre text e password
                  placeholder="Senha"
                  required
                  className="w-full bg-white/5 border border-white/10 py-4 pl-6 pr-14 rounded-full text-white placeholder:text-zinc-600 focus:border-[#c2410c] transition-all outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 text-zinc-500 hover:text-[#c2410c] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#c2410c] hover:bg-white text-black font-black py-4 rounded-full transition-all duration-500 uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
                {isLoading ? 'Verificando...' : 'Entrar na Adega'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/register')}
                className="text-zinc-500 hover:text-white text-xs transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <UserPlus size={14} />
                Ainda não é membro? Solicite acesso
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
