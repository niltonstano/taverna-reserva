import { ArrowRight, Check, Eye, EyeOff, Wine, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';

export function Register() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ✅ Estado para o olhinho
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Lógica de Validação em Tempo Real (Zod Schema Sync) ---
  const passwordRequirements = useMemo(
    () => [
      { label: '8+ caracteres', met: password.length >= 8 },
      { label: 'Letra maiúscula', met: /[A-Z]/.test(password) },
      { label: 'Um número', met: /[0-9]/.test(password) },
      { label: 'Símbolo (!@#$)', met: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );

  const isPasswordValid = passwordRequirements.every((req) => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !isPasswordValid) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3333/api/v1/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await signIn({ email, password });
        navigate('/dashboard');
      } else {
        alert(data.message || 'Erro ao criar conta.');
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor da Taverna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.15] pointer-events-none">
        <img src="/bg/adega2.webp" className="w-full h-full object-cover grayscale" alt="Adega" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#050505]" />
      </div>

      <div className="relative z-10 max-w-xl w-full pt-12 md:pt-20 px-6 md:px-20 flex-grow">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[1px] bg-[#c2410c]" />
            <span className="font-cinzel text-[10px] tracking-[0.6em] text-[#c2410c] uppercase font-bold">Acesso Reservado</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-serif italic leading-[1] tracking-tighter">
            Torne-se <br />
            <span className="text-[#c2410c]">Curador.</span>
          </h1>
        </header>

        <form className="space-y-10" onSubmit={handleSubmit}>
          {/* Inputs de Texto */}
          <div className="space-y-8">
            <div className="border-b border-white/10 focus-within:border-[#c2410c] transition-all pb-3">
              <input
                type="text"
                placeholder="NOME COMPLETO"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent outline-none font-serif italic text-2xl placeholder:text-zinc-700 text-white"
              />
            </div>

            <div className="border-b border-white/10 focus-within:border-[#c2410c] transition-all pb-3">
              <input
                type="email"
                placeholder="E-MAIL"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none font-serif italic text-2xl placeholder:text-zinc-700 text-white"
              />
            </div>

            {/* ✅ Senha com Olhinho */}
            <div className="border-b border-white/10 focus-within:border-[#c2410c] transition-all pb-3 flex items-center gap-4">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="SENHA DE ACESSO"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-grow bg-transparent outline-none font-serif italic text-2xl placeholder:text-zinc-700 text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-500 hover:text-[#c2410c] transition-colors p-2"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          {/* Checklist de Segurança Aprimorado */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8 space-y-5">
            <p className="font-cinzel text-[10px] tracking-[0.4em] text-zinc-500 uppercase">Segurança da Adega:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {passwordRequirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                      req.met ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white/5'
                    }`}
                  >
                    {req.met ? <Check size={14} className="text-black font-bold" /> : <X size={12} className="text-zinc-600" />}
                  </div>
                  <span
                    className={`font-cinzel text-[11px] tracking-widest uppercase transition-colors duration-300 ${
                      req.met ? 'text-emerald-400 font-medium' : 'text-zinc-500'
                    }`}
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ação Principal */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !isPasswordValid}
              className={`flex items-center gap-6 group transition-all p-2 ${
                isSubmitting || !isPasswordValid ? 'opacity-20 grayscale cursor-not-allowed' : 'opacity-100'
              }`}
            >
              <span className="font-cinzel text-[13px] font-black tracking-[0.5em] uppercase group-hover:text-[#c2410c] transition-colors">
                {isSubmitting ? 'VALIDANDO...' : 'SOLICITAR ACESSO'}
              </span>
              <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#c2410c] group-hover:bg-[#c2410c] transition-all duration-500">
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {!isPasswordValid && password.length > 0 && (
              <p className="font-serif italic text-sm text-[#c2410c] mt-6 opacity-80">
                * Por favor, atenda aos requisitos de segurança para prosseguir.
              </p>
            )}
          </div>
        </form>

        <footer className="mt-16 mb-24 flex items-center gap-8 border-t border-white/5 pt-10">
          <p className="font-serif italic text-zinc-500 text-lg">
            Já é membro?{' '}
            <Link to="/login" className="text-white border-b border-[#c2410c] pb-0.5 ml-2 hover:text-[#c2410c] transition-colors">
              Entrar na Cave
            </Link>
          </p>
          <Wine size={20} className="text-[#c2410c] opacity-40" />
        </footer>
      </div>

      <Footer />
    </div>
  );
}
