
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

interface AdminLoginProps {
  aoLogar: (senha: string) => void;
  erro: string;
  fecharAdmin: () => void;
}

export default function AdminLogin({ aoLogar, erro, fecharAdmin }: AdminLoginProps) {
  const [senha, setSenha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    aoLogar(senha);
  };

  return (
    <div className="min-h-screen w-full bg-[#020412] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Efeito de luz no fundo para dar um toque profissional */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-blue-950/80 backdrop-blur-xl border border-blue-800/80 rounded-[2rem] p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center border border-yellow-400/20 mb-4 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
            <ShieldAlert size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-widest text-center">Acesso Restrito</h2>
          <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mt-2 text-center">Comando Central • OS D'SEMPRE</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-blue-400" />
              </div>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha de Admin"
                className="w-full bg-[#020412] border border-blue-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 block pl-11 p-4 transition-all placeholder:text-blue-800 font-bold tracking-widest outline-none"
                required
              />
            </div>
            
            {/* Mensagem de Erro Centralizada */}
            {erro && (
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mt-3 flex items-center gap-1 justify-center animate-bounce">
                ❌ {erro}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-[#020412] font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-400/20"
            >
              Entrar no Painel <ArrowRight size={18} />
            </button>
            
            <button
              type="button"
              onClick={fecharAdmin}
              className="w-full bg-transparent hover:bg-blue-900/40 text-blue-300 font-bold uppercase text-xs tracking-widest py-3 rounded-xl transition-all border border-transparent hover:border-blue-800 flex items-center justify-center gap-2"
            >
              Voltar ao Site
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}