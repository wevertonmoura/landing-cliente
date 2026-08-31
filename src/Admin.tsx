import { useState, useEffect } from 'react';
import { 
  DollarSign, Users, ArrowLeft, Loader2, Search, 
  Check, Download, Trash2, MessageCircle,
  Trophy, Activity, Map, Ticket, Tag, ShoppingCart, Shirt, Edit, Calendar
} from 'lucide-react';

// ==========================================
// SUBCOMPONENTE 1: MODAL DE CUPONS AVANÇADO
// ==========================================
const ModalCupons = ({ senha, onClose }: { senha: string, onClose: () => void }) => {
  const [codigo, setCodigo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [cuponsLista, setCuponsLista] = useState<any[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  useEffect(() => { carregarCupons(); }, []);

  const carregarCupons = async () => {
    setCarregandoLista(true);
    try {
      const res = await fetch('/api/cupom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'listar', senha }) });
      const data = await res.json();
      if (res.ok) setCuponsLista(data);
    } catch (err) { console.error("Erro ao listar cupons:", err); }
    setCarregandoLista(false);
  };

  const criarCupom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch('/api/cupom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'criar', senha, codigo, desconto_percentual: 10 }) });
      const data = await res.json();
      if (res.ok) { setCodigo(''); carregarCupons(); } 
      else { alert(`Erro: ${data.error || 'Não foi possível criar o cupom.'}`); }
    } catch (err) { alert("Falha na conexão."); } 
    finally { setSalvando(false); }
  };

  const excluirCupom = async (id: number, codigoCupom: string) => {
    if (!window.confirm(`Apagar o cupom ${codigoCupom}?`)) return;
    try {
      const res = await fetch('/api/cupom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'excluir', senha, id }) });
      if (res.ok) { setCuponsLista(prev => prev.filter(c => c.id !== id)); } 
      else { alert("Erro ao excluir o cupom."); }
    } catch (err) { alert("Falha na conexão."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-blue-950 border border-blue-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-6 right-6 text-blue-400 hover:text-white transition-colors">✕</button>
        <h2 className="text-2xl font-black text-white uppercase italic mb-2 flex items-center gap-2 shrink-0"><Ticket className="text-yellow-400" /> Gerenciar Cupons</h2>
        <form onSubmit={criarCupom} className="space-y-4 shrink-0 mb-6 border-b border-blue-800/50 pb-6 mt-4">
          <div><input type="text" required placeholder="NOVO CÓDIGO (Ex: FDS10)" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s+/g, ''))} className="w-full bg-blue-900/50 border border-blue-800 rounded-xl p-3 text-white uppercase font-bold placeholder:text-blue-500/50 focus:outline-none focus:border-yellow-400 transition-colors text-sm" /></div>
          <button type="submit" disabled={salvando || !codigo} className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#020412] px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50">{salvando ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} {salvando ? 'Salvando...' : 'Criar Cupom de 10%'}</button>
        </form>
        <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
          <h3 className="text-blue-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Tag size={12}/> Cupons Ativos ({cuponsLista.length})</h3>
          {carregandoLista ? (<div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-400" /></div>) : cuponsLista.length === 0 ? (<p className="text-blue-400/50 text-xs text-center py-4 italic">Nenhum cupom criado ainda.</p>) : (
            cuponsLista.map((cupom, i) => (
              <div key={i} className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-3 flex items-center justify-between group hover:border-blue-700 transition-colors">
                <div><div className="text-white font-black uppercase text-sm tracking-widest">{cupom.codigo}</div><div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{cupom.desconto_percentual}% OFF</div></div>
                <button onClick={() => excluirCupom(cupom.id, cupom.codigo)} className="text-blue-400 hover:text-red-400 bg-blue-900/50 hover:bg-red-500/10 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/20"><Trash2 size={16} /></button>
              </div>
            ))
          )}
        </div>
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

  const [modalCuponsAberto, setModalCuponsAberto] = useState(false);
  
  const [editandoAtleta, setEditandoAtleta] = useState<any>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-listar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha }) });
      const data = await res.json();
      if (data && !data.error) setAdminData(data);
    } catch (err) { console.error("Falha ao carregar dados:", err); }
    setLoading(false);
  };

  const aprovarPagamentoManual = async (id: string) => {
    if (!window.confirm("Confirmar recebimento manual deste pagamento?")) return;
    setAprovandoId(id); 
    try {
      const res = await fetch('/api/admin-aprovar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha, id }) });
      if (res.ok) { setAdminData(prev => prev.map(item => item.id === id ? { ...item, status: 'pago' } : item)); } 
      else throw new Error("Acesso negado");
    } catch (err) { alert("Erro ao aprovar manualmente."); } 
    finally { setAprovandoId(null); }
  };

  const excluirParticipante = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR permanentemente a inscrição de ${nome}?`)) return;
    setExcluindoId(id);
    try {
      const res = await fetch('/api/admin-excluir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha, id }) });
      if (res.ok) { setAdminData(prev => prev.filter(item => item.id !== id)); } 
      else throw new Error("Acesso negado");
    } catch (err) { alert("Erro ao excluir participante."); } 
    finally { setExcluindoId(null); }
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoEdicao(true);
    try {
      const res = await fetch('/api/admin-editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senha,
          id: editandoAtleta.id,
          nome: editandoAtleta.nome,
          numero_peito: editandoAtleta.numero_peito,
          tamanho_camisa: editandoAtleta.tamanho_camisa,
          equipe: editandoAtleta.equipe,
          whatsapp: editandoAtleta.whatsapp || editandoAtleta.telefone
        })
      });
      
      if (res.ok) {
        setAdminData(prev => prev.map(item => item.id === editandoAtleta.id ? { ...item, ...editandoAtleta } : item));
        setEditandoAtleta(null); 
      } else {
        alert("Erro ao salvar a edição.");
      }
    } catch (err) {
      alert("Falha de conexão com o servidor.");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const chamarNoWhatsApp = (telefone: string, nome: string, status: string) => {
    let numeroFormatado = (telefone || '').replace(/\D/g, ''); 
    if (numeroFormatado.length === 10 || numeroFormatado.length === 11) numeroFormatado = '55' + numeroFormatado;
    const primeiroNome = (nome || '').split(' ')[0]; 
    const acompanhantes = adminData.filter(p => p.whatsapp === telefone && p.nome !== nome && p.status === 'pago');
    const nomesAcompanhantes = acompanhantes.map(a => a.nome.split(' ')[0]).join(', ');

    let textoConfirmado = `Fala ${primeiroNome}, tudo bem? Aqui é da organização da *CORRIDA DE ANIVERSÁRIO OS D'SEMPRE*. 🏃‍♂️🏁\n\nPassando para avisar que a sua vaga está *CONFIRMADA* com sucesso! ✅\n\nQueria te pedir um favor: manda aqui uma foto sua e o seu @ do Instagram pra gente já ir entrando no clima do evento e conhecendo a galera.\n\n`;
    if (acompanhantes.length > 0) textoConfirmado += `Como você também garantiu a vaga do pessoal (${nomesAcompanhantes}), manda a foto e o @ deles aqui também, por favor!\n\n`;
    textoConfirmado += `Em breve vamos criar o grupo oficial no WhatsApp com todos os atletas para passar os últimos detalhes (entrega de kits, concentração, etc). Nos vemos na corrida! 🏃‍♂️💨`;

    const textoPendente = `Fala ${primeiroNome}, tudo bem? Aqui é da organização da *CORRIDA DE ANIVERSÁRIO OS D'SEMPRE*. Vi que você iniciou sua inscrição no nosso site, mas o pagamento do PIX ainda não constou pra gente.\n\nAs vagas estão voando! Precisa de alguma ajuda com o pagamento para não ficar de fora? 🤝`;

    const mensagem = status === 'pago' ? encodeURIComponent(textoConfirmado) : encodeURIComponent(textoPendente);
    window.open(`https://wa.me/${numeroFormatado}?text=${mensagem}`, '_blank');
  };

  const formatarDataHora = (dataString: string) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const exportarPlanilha = () => {
    const headers = ["Data e Hora", "Nº Peito", "Nome Completo", "Tamanho Camisa", "Equipe", "CPF", "WhatsApp", "Status", "Valor Pago", "Cupom Usado"];
    const csvRows = adminData.map(p => {
      const dataFormatada = formatarDataHora(p.created_at);
      return [ 
        `"${dataFormatada}"`, `"${p.numero_peito || 'N/A'}"`, `"${p.nome || ''}"`, `"${p.tamanho_camisa || 'N/A'}"`, `"${p.equipe || 'Avulso'}"`, `"${p.cpf || ''}"`, 
        `"${p.whatsapp || p.telefone || ''}"`, `"${p.status === 'pago' ? 'PAGO' : 'PENDENTE'}"`, 
        `"${p.valor_pago || 0}"`, `"${p.cupom_usado || 'Nenhum'}"`
      ].join(';'); 
    });
    const blob = new Blob(["\uFEFF" + [headers.join(';'), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_OS_DSEMPRE_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
  };

  const totalPagos = adminData.filter(p => p.status === 'pago').length;
  const totalPendentes = adminData.filter(p => p.status === 'pendente').length;
  const arrecadado = adminData.filter(p => p.status === 'pago').reduce((acc, curr) => acc + Number(curr.valor_pago || 0), 0); 
  const transacoesUnicas = new Set(adminData.map(p => p.payment_id)).size;
  const totalCuponsUsados = adminData.filter(p => p.cupom_usado && p.cupom_usado.trim() !== '').length;

  const equipesCount = adminData.filter(p => p.status === 'pago' && p.equipe && p.equipe.trim() !== '').reduce((acc: any, p: any) => {
    const nomeEquipe = p.equipe.trim().toUpperCase();
    acc[nomeEquipe] = (acc[nomeEquipe] || 0) + 1;
    return acc;
  }, {});
  const rankingEquipes = Object.entries(equipesCount).map(([nome, qtde]) => ({ nome, quantidade: qtde as number })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
  
  // 🚀 NOVIDADE: RANKING DOS CUPONS MAIS USADOS
  const cuponsCount = adminData.filter(p => p.status === 'pago' && p.cupom_usado && p.cupom_usado.trim() !== '').reduce((acc: any, p: any) => {
    const nomeCupom = p.cupom_usado.trim().toUpperCase();
    acc[nomeCupom] = (acc[nomeCupom] || 0) + 1;
    return acc;
  }, {});
  const rankingCupons = Object.entries(cuponsCount).map(([nome, qtde]) => ({ nome, quantidade: qtde as number })).sort((a, b) => b.quantidade - a.quantidade);
  
  const ultimasInscricoes = adminData.slice(0, 5);

  const dadosFiltrados = adminData.filter(p => 
    (p.nome || '').toLowerCase().includes(busca.toLowerCase()) || 
    (p.whatsapp || p.telefone || '').includes(busca) || 
    (p.equipe || '').toLowerCase().includes(busca.toLowerCase()) ||
    (p.numero_peito && p.numero_peito.toString().includes(busca))
  );

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

      {editandoAtleta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-blue-950 border border-blue-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative">
            <button onClick={() => setEditandoAtleta(null)} className="absolute top-6 right-6 text-blue-400 hover:text-white transition-colors">✕</button>
            <h2 className="text-2xl font-black text-white uppercase italic mb-6 flex items-center gap-2"><Edit className="text-yellow-400" /> Editar Atleta</h2>
            
            <form onSubmit={salvarEdicao} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-blue-300 ml-1">Nome</label>
                <input type="text" required value={editandoAtleta.nome} onChange={(e) => setEditandoAtleta({...editandoAtleta, nome: e.target.value})} className="w-full bg-blue-900/50 border border-blue-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-yellow-400 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-emerald-400 ml-1">Camisa</label>
                  <select value={editandoAtleta.tamanho_camisa || ''} onChange={(e) => setEditandoAtleta({...editandoAtleta, tamanho_camisa: e.target.value})} className="w-full bg-blue-900/50 border border-blue-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-yellow-400 text-sm appearance-none">
                    <option value="PP">PP</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-400 ml-1">Nº Peito</label>
                  <input type="number" value={editandoAtleta.numero_peito || ''} onChange={(e) => setEditandoAtleta({...editandoAtleta, numero_peito: e.target.value})} className="w-full bg-blue-900/50 border border-blue-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-yellow-400 text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-blue-300 ml-1">Equipe</label>
                <input type="text" value={editandoAtleta.equipe || ''} onChange={(e) => setEditandoAtleta({...editandoAtleta, equipe: e.target.value})} className="w-full bg-blue-900/50 border border-blue-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-yellow-400 text-sm" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-blue-300 ml-1">WhatsApp</label>
                <input type="text" value={editandoAtleta.whatsapp || editandoAtleta.telefone || ''} onChange={(e) => setEditandoAtleta({...editandoAtleta, whatsapp: e.target.value})} className="w-full bg-blue-900/50 border border-blue-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-yellow-400 text-sm" />
              </div>

              <button type="submit" disabled={salvandoEdicao} className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#020412] px-4 py-4 mt-2 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50">
                {salvandoEdicao ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} 
                {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-blue-950/60 backdrop-blur-xl border border-blue-900/80 p-6 md:p-8 rounded-[2rem] gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Map size={28} className="text-[#020412]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Comando Central</h1>
              <p className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">OS D'SEMPRE</p>
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-4">
            <button 
              onClick={() => setModalCuponsAberto(true)} 
              className="flex-1 md:flex-none bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all border border-emerald-500/30 shadow-lg"
            >
              <Ticket size={16} /> Gerenciar Cupons
            </button>
            <button onClick={fecharAdmin} className="flex-1 md:flex-none bg-blue-900/80 hover:bg-blue-800 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest transition-all border border-blue-700 shadow-lg group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Sair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-blue-900/90 to-blue-950/90 p-6 rounded-[2rem] border border-blue-800/50 shadow-xl group">
            <div className="w-10 h-10 bg-blue-800/50 rounded-xl flex items-center justify-center text-blue-300 border border-blue-700/50 mb-2"><Users size={20}/></div>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Atletas Pagos</p>
            <h3 className="text-3xl font-black text-white flex items-end gap-2">
              {totalPagos} <span className="text-[10px] text-red-400 font-bold mb-1">({totalPendentes} pendentes)</span>
            </h3>
          </div>

          <div className="bg-gradient-to-br from-blue-900/90 to-blue-950/90 p-6 rounded-[2rem] border border-blue-800/50 shadow-xl group">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 border border-yellow-500/20 mb-2"><ShoppingCart size={20}/></div>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Vendas Geradas</p>
            <h3 className="text-3xl font-black text-white">{transacoesUnicas}</h3>
          </div>

          <div className="bg-gradient-to-br from-blue-900/90 to-blue-950/90 p-6 rounded-[2rem] border border-blue-800/50 shadow-xl group">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-2"><DollarSign size={20}/></div>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Receita Bruta</p>
            <h3 className="text-3xl font-black text-emerald-400">{formatarMoeda(arrecadado)}</h3>
          </div>

          {/* 🚀 O CARD DE CUPONS AGORA EXIBE O RESUMO COMPLETO */}
          <div className="bg-gradient-to-br from-blue-900/90 to-blue-950/90 p-6 rounded-[2rem] border border-blue-800/50 shadow-xl group flex flex-col">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20 mb-2"><Ticket size={20}/></div>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Cupons Usados</p>
            <h3 className="text-3xl font-black text-white mb-2">{totalCuponsUsados}</h3>
            
            <div className="mt-auto space-y-1.5 custom-scrollbar overflow-y-auto max-h-[80px]">
              {rankingCupons.length > 0 ? rankingCupons.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] bg-blue-950/50 px-2 py-1.5 rounded-lg border border-blue-800/30">
                  <span className="text-cyan-400 font-bold tracking-widest">{c.nome}</span>
                  <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-black">{c.quantidade}x</span>
                </div>
              )) : <span className="text-[10px] text-blue-400/50 italic">Nenhum uso pago.</span>}
            </div>
          </div>
        </div>

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
                    <p className="text-white font-bold text-sm truncate max-w-[150px]">
                      <span className="text-yellow-400 mr-1">#{p.numero_peito || '---'}</span> 
                      {p.nome || 'N/A'}
                    </p>
                    <p className="text-blue-300 text-[10px] uppercase font-bold mt-1 tracking-wider">
                      {p.equipe ? `Equipe: ${p.equipe}` : 'Avulso'} • {formatarDataHora(p.created_at)}
                    </p>
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

        <div className="bg-blue-950/60 backdrop-blur-xl rounded-[2.5rem] border border-blue-900/80 overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-blue-900/80 bg-blue-950/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto flex-1">
              <div className="bg-blue-900/50 p-3 rounded-xl border border-blue-800/50"><Search size={20} className="text-yellow-400" /></div>
              <input type="text" placeholder="Buscar por número, nome ou equipe..." value={busca} onChange={(e) => setBusca(e.target.value)} className="bg-transparent border-none outline-none text-base md:text-lg font-bold text-white w-full placeholder:text-blue-400 focus:ring-0" />
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
                      <div className="font-black text-white text-base tracking-tight mb-1 group-hover:text-yellow-400 transition-colors">
                        <span className="text-yellow-400 mr-2">#{p.numero_peito || '---'}</span>
                        {p.nome || 'N/A'}
                      </div>
                      <div className="flex flex-wrap gap-2 items-center mt-2">
                        <span className="text-[10px] bg-blue-900/50 text-blue-200 px-2 py-1 rounded uppercase font-bold border border-blue-800">{p.equipe ? `Equipe: ${p.equipe}` : 'Avulso'}</span>

                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded uppercase font-bold border border-purple-500/30 flex items-center gap-1">
                          <Shirt size={12}/> Camisa: {p.tamanho_camisa || 'N/A'}
                        </span>

                        {p.cupom_usado && p.cupom_usado.trim() !== '' && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded uppercase font-bold border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.15)] flex items-center gap-1">
                            <Tag size={12}/> Cupom: {p.cupom_usado}
                          </span>
                        )}

                        <span className="text-[10px] bg-blue-900/50 text-blue-200 px-2 py-1 rounded uppercase font-bold border border-blue-800 flex items-center gap-1" title="Data da Inscrição">
                          <Calendar size={12}/> {formatarDataHora(p.created_at)}
                        </span>

                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-blue-100 mb-1">{p.whatsapp || p.telefone || 'N/A'}</div>
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
                          <button onClick={() => setEditandoAtleta(p)} className="bg-blue-900/50 hover:bg-blue-600 hover:text-white text-blue-300 p-2 rounded-xl border border-blue-800" title="Editar Atleta">
                            <Edit size={16} />
                          </button>

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