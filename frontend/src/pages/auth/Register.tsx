import { ArrowRight, Wine } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../../components/common/Footer';

export function Register() {
  const navigate = useNavigate();
  // 1. Estados para os campos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2. Função de submissão
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3334/api/v1/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Redireciona para o login após sucesso
        navigate('/login');
      } else {
        alert(data.message || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.15] pointer-events-none">
        <img src="/bg/adega2.webp" className="w-full h-full object-cover grayscale" alt="" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#050505]" />
      </div>

      <div className="relative z-10 max-w-lg w-full pt-4 md:pt-6 px-6 md:px-24 flex-grow">
        <header className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-[1px] bg-[#c2410c]" />
            <span className="font-cinzel text-[8px] tracking-[0.5em] text-[#c2410c] uppercase font-bold">Novo Membro</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic leading-[1] tracking-tight text-white">
            Torne-se <br />
            <span className="text-[#c2410c]">Curador.</span>
          </h1>
        </header>

        {/* 3. Adicionado onSubmit no Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="border-b border-white/20 focus-within:border-[#c2410c] transition-all pb-2">
            <input
              type="text"
              placeholder="NOME"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent outline-none font-serif italic text-xl placeholder:text-zinc-500 text-white"
            />
          </div>

          <div className="border-b border-white/20 focus-within:border-[#c2410c] transition-all pb-2">
            <input
              type="email"
              placeholder="E-MAIL"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent outline-none font-serif italic text-xl placeholder:text-zinc-500 text-white"
            />
          </div>

          <div className="border-b border-white/20 focus-within:border-[#c2410c] transition-all pb-2">
            <input
              type="password"
              placeholder="SENHA"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none font-serif italic text-xl placeholder:text-zinc-500 text-white"
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="flex items-center gap-5 group">
              <span className="font-cinzel text-[9px] font-black tracking-[0.4em] uppercase group-hover:text-[#c2410c] transition-colors text-zinc-100">
                SOLICITAR
              </span>
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#c2410c] group-hover:bg-[#c2410c] transition-all duration-500">
                <ArrowRight size={14} className="text-white group-hover:text-black transition-colors" />
              </div>
            </button>
          </div>
        </form>

        <footer className="mt-8 mb-20 flex items-center gap-6">
          <p className="font-serif italic text-zinc-400 text-sm">
            Já é membro?{' '}
            <Link to="/login" className="text-white border-b border-[#c2410c] pb-0.5 ml-1 hover:text-[#c2410c] transition-colors">
              Entrar na Cave
            </Link>
          </p>
          <div className="h-3 w-[1px] bg-white/20" />
          <Wine size={14} className="text-[#c2410c] opacity-60" />
        </footer>
      </div>

      <div className="absolute bottom-32 right-6 opacity-40 rotate-90 origin-right text-white z-10">
        <p className="font-cinzel text-[7px] tracking-[1em] uppercase">Taverna Selection</p>
      </div>

      <Footer />
    </div>
  );
}
