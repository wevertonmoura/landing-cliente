import { useState, useEffect } from 'react';
import { 
  UserCheck, DollarSign, Users, ArrowLeft, Loader2, Search, 
  Check, Download, Trash2, Clock, MessageCircle, AlertCircle,
  Trophy, Activity, Map, Ticket, Percent
} from 'lucide-react';

// ==========================================
// SUBCOMPONENTE 1: MODAL DE CUPONS
// ==========================================
const ModalCupons = ({ senha, onClose }: { senha: string, onClose: () => void }) => {
  const [codigo, setCodigo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const criarCupom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      // 🚀 ROTA E ACTION ATUALIZADAS AQUI
      const res = await fetch('/api/cupom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Action 'criar' adicionada para o backend saber o que fazer
        body: JSON.stringify({ action: 'criar', senha, codigo, desconto_percentual: 10 }) 
      });
      
      const data = await res.json();

      if (res.ok) {
        alert("Cupom de 10% criado com sucesso!");
        onClose();
      } else {
        // Agora mostra o erro exato do banco (ex: Cupom duplicado)
        alert(`Erro: ${data.error || 'Não foi possível criar o cupom.'}`);
      }
    } catch (err) {
      alert("Falha na conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-blue-950 border border-blue-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-blue-400 hover:text-white transition-colors">✕</button>
        
        <h2 className="text-2xl font-black text-white uppercase italic mb-2 flex items-center gap-2">
          <Ticket className="text-yellow-400" /> Gerar Cupom
        </h2>
        <p className="text-blue-300 text-xs mb-6">Este cupom aplicará automaticamente 10% de desconto no checkout.</p>

        <form onSubmit={criarCupom} className="space-y-4">
          <div>
            <label className="block text-blue-300 text-[10px] font-black uppercase tracking-widest mb-2">Código do Cupom</label>
            <input 
              type="text" 
              required
              placeholder="Ex: OS-DSEMPRE-10"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s+/g, ''))}
              className="w-full bg-blue-900/50 border border-blue-800 rounded-xl p-4 text-white uppercase font-bold placeholder:text-blue-500/50 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Desconto Fixo</span>
            <span className="bg-emerald-500 text-[#020412] px-3 py-1 rounded-lg font-black flex items-center gap-1">
              10 <Percent size={14}/>
            </span>
          </div>

          <button 
            type="submit" 
            disabled={salvando}
            className="w-full mt-4 bg-yellow-500 hover:bg-yellow-400 text-[#020412] px-6 py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {salvando ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
            {salvando ? 'Salvando...' : 'Ativar Cupom'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL: ADMIN
// ==========================================
const Admin = ({ senha, formatarMoeda, fecharAdmin }: any) => {
  const [adminData, setAdminData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [aprovandoId, setAprovandoId] = useState<string | null>(null); 
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  
  // Estado para controlar a abertura do modal de cupons
  const [modalCuponsAberto, setModalCuponsAberto] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-listar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha })
      });
      const data = await res.json();
      if (data && !data.error) setAdminData(data);
    } catch (err) {
      console.error("Falha ao carregar dados:", err);
    }
    setLoading(false);
  };

  const aprovarPagamentoManual = async (id: string) => {
    if (!window.confirm("Confirmar recebimento manual deste pagamento?")) return;
    setAprovandoId(id); 
    try {
      const res = await fetch('/api/admin-aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha, id })
      });
      if (res.ok) {
        setAdminData(prev => prev.map(item => item.id === id ? { ...item, status: 'pago' } : item));
      } else throw new Error("Acesso negado");
    } catch (err) { alert("Erro ao aprovar manualmente."); } 
    finally { setAprovandoId(null); }
  };

  const excluirParticipante = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR permanentemente a inscrição de ${nome}?`)) return;
    setExcluindoId(id);
    try {
      const res = await fetch('/api/admin-excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha, id })
      });
      if (res.ok) {
        setAdminData(prev => prev.filter(item => item.id !== id));
      } else throw new Error("Acesso negado");
    } catch (err) { alert("Erro ao excluir participante."); } 
    finally { setExcluindoId(null); }
  };

  const chamarNoWhatsApp = (telefone: string, nome: string, status: string) => {
    let numeroFormatado = (telefone || '').replace(/\D/g, ''); 
    if (numeroFormatado.length === 10 || numeroFormatado.length === 11) numeroFormatado = '55' + numeroFormatado;
    const primeiroNome = (nome || '').split(' ')[0]; 
    const acompanhantes = adminData.filter(p => p.whatsapp === telefone && p.nome !== nome && p.status === 'pago');
    const nomesAcompanhantes = acompanhantes.map(a => a.nome.split(' ')[0]).join(', ');
    
    let textoConfirmado = `Fala ${primeiroNome}, tudo bem? Aqui é da organização da *OS D'SEMPRE TRILHA*. 🌿\n\nPassando para avisar que a sua vaga está *CONFIRMADA* com sucesso! ✅\n\nQueria te pedir um favor: manda aqui uma foto sua e o seu @ do Instagram pra gente já ir entrando no clima do evento e conhecendo a galera.\n\n`;
    if (acompanhantes.length > 0) textoConfirmado += `Como você também garantiu a vaga do pessoal (${nomesAcompanhantes}), manda a foto e o @ deles aqui também, por favor!\n\n`;
    textoConfirmado += `Em breve vamos criar o grupo oficial no WhatsApp com todos os atletas para passar os últimos detalhes (ponto de encontro, dicas, etc). Prepare-se para uma experiência incrível na natureza! Nos vemos na trilha! ⛰️🏃‍♂️`;

    const textoPendente = `Fala ${primeiroNome}, tudo bem? Aqui é da organização da *OS D'SEMPRE TRILHA*. Vi que você iniciou sua inscrição no nosso site, mas o pagamento do PIX ainda não constou pra gente.\n\nAs vagas estão voando! Precisa de alguma ajuda com o pagamento para não ficar de fora? 🤝`;
    const mensagem = status === 'pago' ? encodeURIComponent(textoConfirmado) : encodeURIComponent(textoPendente);
    window.open(`https://wa.me/${numeroFormatado}?text=${mensagem}`, '_blank');
  };

  const exportarPlanilha = () => {
    const headers = ["Data Inscrição", "Nome Completo", "Equipe", "CPF", "WhatsApp", "Status", "Valor Pago", "Contato de Emergência"];
    const csvRows = adminData.map(p => {
      const dataFormatada = p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '';
      return [ 
        `"${dataFormatada}"`, `"${p.nome || ''}"`, `"${p.equipe || 'Avulso'}"`, `"${p.cpf || ''}"`, 
        `"${p.whatsapp || p.telefone || ''}"`, `"${p.status === 'pago' ? 'PAGO' : 'PENDENTE'}"`, 
        `"${p.valor_pago || 0}"`, `"${p.emergencia_nome || ''} - ${p.emergencia_fone || p.contato_emergencia || ''}"` 
      ].join(';'); 
    });
    const blob = new Blob(["\uFEFF" + [headers.join(';'), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_OS_DSEMPRE_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
  };

  // Cálculos Derivados
  const totalPagos = adminData.filter(p => p.status === 'pago').length;
  const totalPendentes = adminData.filter(p => p.status === 'pendente').length;
  const arrecadado = adminData.filter(p => p.status === 'pago').reduce((acc, curr) => acc + Number(curr.valor_pago || 0), 0); 
  
  const equipesCount = adminData.filter(p => p.status === 'pago' && p.equipe && p.equipe.trim() !== '').reduce((acc: any, p: any) => {
    const nomeEquipe = p.equipe.trim().toUpperCase();
    acc[nomeEquipe] = (acc[nomeEquipe] || 0) + 1;
    return acc;
  }, {});
  const rankingEquipes = Object.entries(equipesCount).map(([nome, qtde]) => ({ nome, quantidade: qtde as number })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
  const ultimasInscricoes = adminData.slice(0, 5);
  const dadosFiltrados = adminData.filter(p => (p.nome || '').toLowerCase().includes(busca.toLowerCase()) || (p.whatsapp || p.telefone || '').includes(busca) || (p.equipe || '').toLowerCase().includes(busca.toLowerCase()));

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  if (loading) return (
    <div className="min-h-screen bg-[#020412] flex flex-col items-center justify-center gap-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/20 blur-[100px] rounded-full"></div>
      <Loader2 className="animate-spin text-yellow-400 relative z-10" size={48} />
      <p className="text-blue-200 text-xs font-bold uppercase tracking-widest animate-pulse relative z-10">Carregando cofre de dados...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020412] p-4 md:p-8 font-sans relative overflow-hidden z-0">
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {modalCuponsAberto && <ModalCupons senha={senha} onClose={() => setModalCuponsAberto(false)} />}

      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* HEADER LIMPO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-blue-950/60 backdrop-blur-xl border border-blue-900/80 p-6 md:p-8 rounded-[2rem] gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Map size={28} className="text-[#020412]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Comando Central</h1>
              <p className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">OS D'SEMPRE TRILHA</p>
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-4">
            <button 
              onClick={() => setModalCuponsAberto(true)} 
              className="flex-1 md:flex-none bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all border border-emerald-500/30 shadow-lg"
            >
              <Ticket size={16} /> Gerar Cupom (10%)
            </button>
            <button onClick={fecharAdmin} className="flex-1 md:flex-none bg-blue-900/80 hover:bg-blue-800 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest transition-all border border-blue-700 shadow-lg group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Sair
            </button>
          </div>
        </div>

        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-blue-900/90 to-blue-950/90 p-6 rounded-[2rem] border border-blue-800/50 shadow-xl group">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-2"><UserCheck size={20}/></div>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Pagos</p>
            <h3 className="text-3xl font-black text-white">{totalPagos}</h3>
          </div>
          <div className="bg-gradient-to-br from-blue-900/90 to-blue-950/90 p-6 rounded-[2rem] border border-blue-800/50 shadow-xl group">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 border border-yellow-500/20 mb-2"><Clock size={20}/></div>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Pendentes</p>
            <h3 className="text-3xl font-black text-white">{totalPendentes}</h3>
          </div>
          <div className="bg-gradient-to-br from-blue-900/90 to-blue-950/90 p-6 rounded-[2rem] border border-blue-800/50 shadow-xl group">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-2"><DollarSign size={20}/></div>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Receita Bruta</p>
            <h3 className="text-3xl font-black text-emerald-400">{formatarMoeda(arrecadado)}</h3>
          </div>
          <div className="bg-gradient-to-br from-blue-900/90 to-blue-950/90 p-6 rounded-[2rem] border border-blue-800/50 shadow-xl">
            <div className="w-10 h-10 bg-blue-800/50 rounded-xl flex items-center justify-center text-blue-300 border border-blue-700/50 mb-2"><Users size={20}/></div>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Registros</p>
            <h3 className="text-3xl font-black text-white">{adminData.length}</h3>
          </div>
        </div>

        {/* FEED E TABELA (MANTIDOS IGUAIS, APENAS REORGANIZADOS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-950/60 backdrop-blur-xl rounded-[2rem] border border-blue-900/80 p-6 shadow-2xl">
            <h3 className="text-white font-black uppercase italic mb-6 flex items-center gap-2 border-b border-blue-800/50 pb-4">
              <Trophy className="text-yellow-400" /> Top 5 Equipes
            </h3>
            <div className="space-y-4">
              {rankingEquipes.length > 0 ? rankingEquipes.map((equipe, idx) => (
                <div key={idx} className="flex items-center justify-between bg-blue-900/40 p-3 rounded-xl border border-blue-800/50">
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-lg ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-blue-400'}`}>#{idx + 1}</span>
                    <span className="text-white font-bold uppercase text-sm truncate max-w-[120px]">{equipe.nome}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-2 py-1 rounded-lg border border-emerald-500/30">{equipe.quantidade} Atletas</span>
                </div>
              )) : <p className="text-blue-300 text-sm text-center py-4">Nenhuma equipe confirmada ainda.</p>}
            </div>
          </div>
          <div className="md:col-span-2 bg-blue-950/60 backdrop-blur-xl rounded-[2rem] border border-blue-900/80 p-6 shadow-2xl">
            <h3 className="text-white font-black uppercase italic mb-6 flex items-center gap-2 border-b border-blue-800/50 pb-4">
              <Activity className="text-emerald-400" /> Inscrições Recentes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ultimasInscricoes.map((p, i) => (
                <div key={i} className="bg-blue-900/30 p-4 rounded-xl border border-blue-800/30 flex justify-between items-start">
                  <div>
                    <p className="text-white font-bold text-sm truncate max-w-[150px]">{p.nome || 'N/A'}</p>
                    <p className="text-blue-300 text-[10px] uppercase font-bold mt-1 tracking-wider">{p.equipe || 'Avulso'}</p>
                  </div>
                  <div>
                    {p.status === 'pago' 
                      ? <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded uppercase font-black">PAGO</span> 
                      : <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded uppercase font-black">PENDENTE</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABELA DE DADOS */}
        <div className="bg-blue-950/60 backdrop-blur-xl rounded-[2.5rem] border border-blue-900/80 overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-blue-900/80 bg-blue-950/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto flex-1">
              <div className="bg-blue-900/50 p-3 rounded-xl border border-blue-800/50"><Search size={20} className="text-yellow-400" /></div>
              <input type="text" placeholder="Buscar por nome, equipe ou celular..." value={busca} onChange={(e) => setBusca(e.target.value)} className="bg-transparent border-none outline-none text-base md:text-lg font-bold text-white w-full placeholder:text-blue-400 focus:ring-0" />
            </div>
            <button onClick={exportarPlanilha} className="w-full md:w-auto bg-blue-900/50 hover:bg-blue-800 text-blue-300 px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all border border-blue-800 shadow-lg">
              <Download size={18} /> Exportar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#020412]/50 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="p-6 whitespace-nowrap">Atleta / Equipe</th>
                  <th className="p-6 whitespace-nowrap">Contatos</th>
                  <th className="p-6 whitespace-nowrap text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/50 text-sm">
                {dadosFiltrados.map((p, i) => (
                  <tr key={i} className="hover:bg-blue-900/20 transition-all duration-300 group">
                    <td className="p-6">
                      <div className="font-black text-white text-base tracking-tight mb-1 group-hover:text-yellow-400 transition-colors">{p.nome || 'N/A'}</div>
                      <div className="flex flex-col gap-2 items-start">
                        <span className="text-[10px] bg-blue-900/50 text-blue-200 px-2 py-1 rounded uppercase font-bold border border-blue-800">{p.equipe ? `Equipe: ${p.equipe}` : 'Avulso'}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-blue-100 mb-1">{p.whatsapp || p.telefone || 'N/A'}</div>
                      <div className="text-[10px] text-blue-300 uppercase font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span> SOS: <span className="text-blue-200">{p.emergencia_nome}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {p.status === 'pago' ? (
                          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Pago</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full">
                            <span className="text-[10px] font-black text-yellow-500 tracking-widest uppercase">Pendente</span>
                          </div>
                        )}
                        <div className="flex gap-2 ml-2">
                          {p.status !== 'pago' && (
                            <button onClick={() => aprovarPagamentoManual(p.id)} disabled={aprovandoId === p.id} className="bg-blue-900/50 hover:bg-emerald-600 hover:text-white text-blue-300 p-2 rounded-xl border border-blue-800">
                              {aprovandoId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                          )}
                          <button onClick={() => chamarNoWhatsApp(p.whatsapp || p.telefone, p.nome, p.status)} className="bg-blue-900/50 hover:bg-[#25D366] hover:text-white text-blue-300 p-2 rounded-xl border border-blue-800">
                            <MessageCircle size={16} />
                          </button>
                          <button onClick={() => excluirParticipante(p.id, p.nome)} disabled={excluindoId === p.id} className="bg-blue-900/50 hover:bg-red-600 hover:text-white text-blue-300 p-2 rounded-xl border border-blue-800">
                            {excluindoId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;