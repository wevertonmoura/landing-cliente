import React, { useState } from 'react';
import { Trash2, Plus, AlertCircle, Loader2, ChevronRight, User, Users } from 'lucide-react';

interface FormularioProps {
  participants: any[];
  updateParticipant: (index: number, field: string, value: string) => void;
  removeParticipant: (index: number) => void;
  addParticipant: () => void;
  vagasOcupadas: number;
  LIMITE_VAGAS: number;
  termsAccepted: boolean;
  setTermsAccepted: (val: boolean) => void;
  errorMsg: string;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  valorTotal: number;
  formatarMoeda: (valor: number) => string;
}

const FormularioInscricao: React.FC<FormularioProps> = ({
  participants, updateParticipant, removeParticipant, addParticipant,
  vagasOcupadas, LIMITE_VAGAS, termsAccepted, setTermsAccepted,
  errorMsg, loading, handleSubmit, valorTotal, formatarMoeda
}) => {
  // Estado local apenas para a interface dos botões
  const [tipoSelecionado, setTipoSelecionado] = useState<'individual' | 'equipe'>('individual');

  return (
    <>
      <div className="text-center mb-8 relative">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg">
          Inscrição
        </h2>
        <p className="text-yellow-400 font-bold text-sm tracking-widest mt-2 uppercase">
          R$ 40 Individual | R$ 35 (Equipes +10)
        </p>
      </div>

      {/* Botões de Seleção (Individual / Equipe) */}
      <div className="flex gap-2 mb-8 bg-blue-900/20 p-1.5 rounded-xl border border-blue-800/40">
        <button
          type="button"
          onClick={() => setTipoSelecionado('individual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            tipoSelecionado === 'individual'
              ? 'bg-yellow-400 text-[#020412] shadow-md'
              : 'text-blue-300 hover:text-white hover:bg-blue-800/30'
          }`}
        >
          <User size={16} /> Individual
        </button>
        <button
          type="button"
          onClick={() => setTipoSelecionado('equipe')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            tipoSelecionado === 'equipe'
              ? 'bg-yellow-400 text-[#020412] shadow-md'
              : 'text-blue-300 hover:text-white hover:bg-blue-800/30'
          }`}
        >
          <Users size={16} /> Equipes (+10)
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {participants.map((participant, index) => (
          <div key={index} className="p-6 rounded-3xl bg-blue-900/30 border border-blue-800/50 relative shadow-sm overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${index === 0 ? 'bg-yellow-400' : 'bg-blue-600'}`}></div>

            <div className="flex justify-between items-center mb-4 pl-2 border-b border-blue-800/50 pb-2">
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${index === 0 ? 'text-yellow-400' : 'text-blue-300'}`}>
                {index === 0 ? "👤 Titular da Inscrição (Responsável)" : `👥 Atleta ${index + 1}`}
              </h3>
              {index > 0 && (
                <button type="button" onClick={() => removeParticipant(index)} className="text-blue-400 hover:text-red-500 transition-colors p-1" title="Remover Atleta">
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-blue-300 ml-1">Nome Completo</label>
                <input type="text" value={participant.name} onChange={e => updateParticipant(index, 'name', e.target.value)} className="w-full bg-[#020412] border border-blue-800/80 rounded-xl px-4 py-3 focus:border-yellow-400 outline-none font-bold text-sm text-white placeholder-blue-900 transition-all shadow-sm" placeholder="Ex: João Silva" />
              </div>

              {/* O campo equipe aparece para todos se a aba Equipe estiver selecionada, ou só como opcional no individual */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-blue-300 ml-1">
                  Nome da Equipe {tipoSelecionado === 'individual' && '(Opcional)'}
                </label>
                <input 
                  type="text" 
                  value={participant.equipe} 
                  onChange={e => updateParticipant(index, 'equipe', e.target.value)} 
                  required={tipoSelecionado === 'equipe'}
                  className="w-full bg-[#020412] border border-blue-800/80 rounded-xl px-4 py-3 focus:border-yellow-400 outline-none font-bold text-sm text-white placeholder-blue-900 transition-all shadow-sm" 
                  placeholder="Ex: OS TRAILL OS D'SEMPRE" 
                />
              </div>

              {index === 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-blue-300 ml-1">WhatsApp</label>
                      <input type="tel" value={participant.phone} onChange={e => updateParticipant(index, 'phone', e.target.value)} className="w-full bg-[#020412] border border-blue-800/80 rounded-xl px-4 py-3 focus:border-yellow-400 outline-none font-bold text-sm text-white placeholder-blue-900 transition-all shadow-sm" placeholder="(81) 99999-9999" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-blue-300 ml-1">CPF (Necessário para a compra)</label>
                      <input type="text" required value={participant.cpf} onChange={e => updateParticipant(index, 'cpf', e.target.value)} className="w-full bg-[#020412] border border-blue-800/80 rounded-xl px-4 py-3 focus:border-yellow-400 outline-none font-bold text-sm text-white placeholder-blue-900 transition-all shadow-sm" placeholder="000.000.000-00" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-blue-300 ml-1">E-mail</label>
                    <input type="email" value={participant.email} onChange={e => updateParticipant(index, 'email', e.target.value)} className="w-full bg-[#020412] border border-blue-800/80 rounded-xl px-4 py-3 focus:border-yellow-400 outline-none font-bold text-sm text-white placeholder-blue-900 transition-all shadow-sm" placeholder="seu@gmail.com" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-blue-300 ml-1">Contato de Emergência (SOS)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={participant.emergencyName} onChange={e => updateParticipant(index, 'emergencyName', e.target.value)} className="w-full bg-[#020412] border border-blue-800/80 rounded-xl px-4 py-3 focus:border-yellow-400 outline-none font-bold text-sm text-white placeholder-blue-900 transition-all shadow-sm" placeholder="Nome" />
                      <input type="tel" value={participant.emergencyPhone} onChange={e => updateParticipant(index, 'emergencyPhone', e.target.value)} className="w-full bg-[#020412] border border-blue-800/80 rounded-xl px-4 py-3 focus:border-yellow-400 outline-none font-bold text-sm text-white placeholder-blue-900 transition-all shadow-sm" placeholder="(81) 99999-9999" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        
        {vagasOcupadas + participants.length < LIMITE_VAGAS && (
           <button type="button" onClick={addParticipant} className="w-full py-4 border-2 border-dashed border-blue-800/50 rounded-2xl text-blue-300 font-bold hover:border-yellow-400 hover:text-yellow-400 bg-blue-900/10 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest">
             <Plus size={16} /> Adicionar Atleta
           </button>
        )}

        {/* Aviso para quem selecionou equipe mas não colocou 10 pessoas */}
        {tipoSelecionado === 'equipe' && participants.length < 10 && (
          <div className="bg-blue-900/50 border border-blue-400/50 text-blue-200 p-3 rounded-xl text-xs text-center">
            Adicione pelo menos <strong>10 atletas</strong> para liberar o valor promocional de R$ 35 por pessoa.
          </div>
        )}

        <label className="flex items-start gap-3 pt-6 border-t border-blue-800/50 cursor-pointer group">
          <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 h-5 w-5 accent-yellow-400 cursor-pointer rounded shrink-0 group-hover:ring-2 ring-yellow-400/50 transition-all" />
          <span className="text-[11px] text-blue-200 font-bold leading-relaxed select-none group-hover:text-white transition-colors">
            Aceito o Termo de Responsabilidade (declaro estar em boas condições de saúde) e estou ciente de que NÃO haverá devolução ou reembolso do valor pago sob nenhuma hipótese.
          </span>
        </label>

        {errorMsg && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2"><AlertCircle size={14}/> {errorMsg}</div>}
        
        <button disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-[#020412] font-black py-5 rounded-2xl shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-sm mt-4">
          {loading ? <Loader2 className="animate-spin" /> : <>Finalizar Inscrição (R$ {formatarMoeda(valorTotal)}) <ChevronRight size={20} /></>}
        </button>
      </form>
    </>
  );
};

export default FormularioInscricao;