import { ArrowRight, Lock, Mail, ShieldCheck, User, Wine } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Register() {
  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Container Principal de Luxo */}
      <div className="w-full max-w-xl bg-slate-900/80 border border-amber-900/20 p-8 md:p-12 rounded-[40px] md:rounded-[60px] shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Marca d'água decorativa */}
        <Wine className="absolute -right-12 -top-12 text-amber-500/5 rotate-12" size={240} />

        {/* Cabeçalho da Experiência */}
        <div className="text-center mb-10 relative z-10">
          <h2 className="text-4xl md:text-5xl font-serif text-amber-500 italic leading-none">
            Taverna
            <span className="block text-xs font-cinzel text-slate-100 not-italic tracking-[0.6em] uppercase mt-4">Iniciação Reserva</span>
          </h2>
          <div className="w-16 h-[1px] bg-amber-900/40 mx-auto mt-6"></div>
          <p className="text-slate-500 text-[10px] mt-6 uppercase tracking-[0.25em] font-bold font-sans max-w-xs mx-auto leading-relaxed">
            Solicite seu acesso à curadoria privada e comece sua jornada enológica.
          </p>
        </div>

        {/* Formulário */}
        <form className="space-y-5 relative z-10" onSubmit={(e) => e.preventDefault()}>
          {/* Campo: Nome Completo */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-cinzel text-amber-900 uppercase tracking-widest ml-5">Nome do Confrade</label>
            <div className="relative group">
              <User
                className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-900 group-focus-within:text-amber-500 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Como devemos chamá-lo?"
                className="w-full bg-slate-950/50 border border-amber-900/10 p-4 pl-12 rounded-full outline-none focus:border-amber-500/50 text-slate-300 placeholder:text-slate-800 transition-all font-sans text-sm"
              />
            </div>
          </div>

          {/* Campo: E-mail de Membro */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-cinzel text-amber-900 uppercase tracking-widest ml-5">Endereço de Convite</label>
            <div className="relative group">
              <Mail
                className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-900 group-focus-within:text-amber-500 transition-colors"
                size={16}
              />
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full bg-slate-950/50 border border-amber-900/10 p-4 pl-12 rounded-full outline-none focus:border-amber-500/50 text-slate-300 placeholder:text-slate-800 transition-all font-sans text-sm"
              />
            </div>
          </div>

          {/* Campo: Senha Mestra */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-cinzel text-amber-900 uppercase tracking-widest ml-5">Código de Segurança</label>
            <div className="relative group">
              <Lock
                className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-900 group-focus-within:text-amber-500 transition-colors"
                size={16}
              />
              <input
                type="password"
                placeholder="Crie sua senha de acesso"
                className="w-full bg-slate-950/50 border border-amber-900/10 p-4 pl-12 rounded-full outline-none focus:border-amber-500/50 text-slate-300 placeholder:text-slate-800 transition-all font-sans text-sm"
              />
            </div>
          </div>

          {/* Badge de Proteção */}
          <div className="flex items-center justify-center gap-3 py-2 bg-amber-500/5 rounded-full border border-amber-500/10">
            <ShieldCheck size={14} className="text-amber-600" />
            <p className="text-[9px] text-slate-500 font-serif italic uppercase tracking-wider">Dados protegidos pela criptografia da adega.</p>
          </div>

          {/* Botão de Finalização */}
          <button className="group w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-cinzel font-bold py-5 rounded-full uppercase tracking-[0.3em] text-[11px] transition-all shadow-xl shadow-amber-600/10 mt-6 flex items-center justify-center gap-2 active:scale-95">
            Criar Minha Cave
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Link para Login */}
          <div className="text-center mt-8 pt-6 border-t border-amber-900/10">
            <p className="text-[10px] font-sans text-slate-500 uppercase tracking-widest">
              Já faz parte da confraria?{' '}
              <Link to="/login" className="text-amber-500 hover:text-amber-400 font-black transition-colors ml-1">
                Acessar Adega
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Assinatura Final */}
      <div className="mt-12 flex flex-col items-center gap-2">
        <div className="w-8 h-[1px] bg-amber-900/40"></div>
        <p className="text-slate-700 text-[9px] font-cinzel uppercase tracking-[0.5em]">Taverna Reserva • MMXIV</p>
      </div>
    </div>
  );
}
