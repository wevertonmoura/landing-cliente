import React, { useState, useEffect } from 'react';
import { ChevronRight, Loader2, AlertCircle, Plus, Trash2, Copy, QrCode, CheckCircle, X, ArrowLeft, Lock, Hourglass, Clock, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORTAÇÕES DOS COMPONENTES NOVOS
import Admin from './Admin';
import { validarCPF, formatarMoeda } from './utils/helpers';
import HeroSection from './components/HeroSection';
import EventInfo from './components/EventInfo';
import Footer from './components/Footer';

const Trilha3Reinos = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  
  const [telaAtual, setTelaAtual] = useState<'formulario' | 'pix' | 'login_admin' | 'admin'>('formulario');
  const [statusPagamento, setStatusPagamento] = useState<'pendente' | 'pago'>('pendente');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [erroLoginAdmin, setErroLoginAdmin] = useState('');

  const LIMITE_VAGAS = 60;
  const [vagasOcupadas, setVagasOcupadas] = useState(0);
  const [verificandoVagas, setVerificandoVagas] = useState(true);
  const [listaEsperaNome, setListaEsperaNome] = useState('');
  const [listaEsperaFone, setListaEsperaFone] = useState('');
  const [entrouLista, setEntrouLista] = useState(false);

  const taxaPix = 1;
  const calcularValorIngressos = (qtd: number) => {
    const pares = Math.floor(qtd / 2); 
    const avulsos = qtd % 2;           
    return (pares * 90) + (avulsos * 50);
  };

  const [qrCodePix, setQrCodePix] = useState(''); 
  const [qrCodeImg, setQrCodeImg] = useState(''); 
  const [copiado, setCopiado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(900); 

  const [participants, setParticipants] = useState([
    { name: '', email: '', phone: '', cpf: '', emergencyName: '', emergencyPhone: '' }
  ]);

  const images = ["/foto1.jpg", "/foto2.jpg", "/foto3.jpg", "/foto4.jpg"];

  useEffect(() => {
    const fetchVagas = async () => {
      try {
        const res = await fetch('/api/checar-vagas');
        const data = await res.json();
        setVagasOcupadas(data.total || 0);
      } catch (err) {
        console.error("Erro ao checar vagas");
      } finally {
        setVerificandoVagas(false);
      }
    };
    fetchVagas();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setTelaAtual('login_admin'); 
    }
  }, []);

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLoginAdmin('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senhaAdmin })
      });
      if (res.ok) setTelaAtual('admin');
      else setErroLoginAdmin('Senha incorreta.');
    } catch { setErroLoginAdmin('Erro de comunicação.'); }
  };

  useEffect(() => {
    let timer: any;
    if (telaAtual === 'pix' && statusPagamento === 'pendente' && tempoRestante > 0) {
      timer = setInterval(() => setTempoRestante(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [telaAtual, statusPagamento, tempoRestante]);

  const formatarTempo = (segundos: number) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    let intervalo: any;
    if (paymentId && statusPagamento === 'pendente' && telaAtual === 'pix') {
      intervalo = setInterval(async () => {
        try {
          const res = await fetch(`/api/checar-pagamento?paymentId=${paymentId}`);
          const data = await res.json();
          if (data.status === 'approved') {
            setStatusPagamento('pago');
            clearInterval(intervalo);
          }
        } catch (err) { console.error(err); }
      }, 3000);
    }
    return () => clearInterval(intervalo);
  }, [paymentId, statusPagamento, telaAtual]);

  const removeParticipant = (index: number) => {
    const newParticipants = [...participants];
    newParticipants.splice(index, 1);
    setParticipants(newParticipants);
  };

  const addParticipant = () => {
    if (vagasOcupadas + participants.length >= LIMITE_VAGAS) {
      alert("Atenção: Vagas insuficientes para adicionar outro acompanhante!");
      return;
    }
    setParticipants([...participants, { name: '', email: '', phone: '', cpf: '', emergencyName: '', emergencyPhone: '' }]);
  };

  const updateParticipant = (index: number, field: string, value: string) => {
    const newParticipants = [...participants];
    let v = value;
    if (field === 'phone' || field === 'emergencyPhone' || field === 'listaEsperaFone') {
      v = v.replace(/\D/g, "").slice(0, 11); 
      if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`; 
      if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`; 
    } else if (field === 'cpf') {
      v = v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    newParticipants[index] = { ...newParticipants[index], [field]: v };
    setParticipants(newParticipants);
  };

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('inscricao')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleListaEspera = (e: React.FormEvent) => {
    e.preventDefault();
    if (listaEsperaNome.trim().length < 3 || listaEsperaFone.length < 14) {
      alert("Preencha seus dados corretamente!"); return;
    }
    const msg = `🚀 *LISTA VIP - TRILHA 3 REINOS* 🚀%0A%0A*Nome:* ${listaEsperaNome}%0A*WhatsApp:* ${listaEsperaFone}%0A%0AOlá! Vi que as vagas esgotaram. Gostaria de entrar na lista de espera caso alguém desista!`;
    window.open(`https://wa.me/5581994350798?text=${msg}`, '_blank');
    setEntrouLista(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (vagasOcupadas + participants.length > LIMITE_VAGAS) {
      setErrorMsg(`Infelizmente não temos vagas suficientes disponíveis agora.`);
      return;
    }

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (p.name.trim().length < 3) { setErrorMsg(i === 0 ? `Preencha o nome do Titular.` : `Preencha o nome do Acompanhante ${i}.`); return; }
      
      if (i === 0) {
        if (p.phone.replace(/\D/g, '').length < 10) { setErrorMsg(`WhatsApp incompleto no Titular.`); return; }
        if (!validarCPF(p.cpf)) { setErrorMsg(`⚠️ CPF Inválido! Verifique o número digitado pelo Titular.`); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(p.email)) { setErrorMsg("Digite um e-mail válido."); return; }
        if (p.emergencyName.trim().length < 2 || p.emergencyPhone.replace(/\D/g, '').length < 10) { 
          setErrorMsg("Preencha corretamente os dados de Emergência (SOS)."); return; 
        }
      }
    }
    
    if (!termsAccepted) { setErrorMsg("Aceite o termo de responsabilidade e regras de cancelamento."); return; }

    setLoading(true);
    setErrorMsg('');
    setStatusPagamento('pendente');

    try {
      const mainEmergency = `${participants[0].emergencyName} - ${participants[0].emergencyPhone}`;
      const mainEmail = participants[0].email;
      const valorTotal = Number((calcularValorIngressos(participants.length) + taxaPix).toFixed(2));

      const response = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantes: participants,
          valorTotal: valorTotal,
          emailPrincipal: mainEmail,
          contatoEmergencia: mainEmergency
        })
      });

      const mpData = await response.json();
      if (!response.ok) throw new Error(mpData.error || "Erro ao processar inscrição no servidor.");

      if (mpData.point_of_interaction?.transaction_data) {
        setQrCodePix(mpData.point_of_interaction.transaction_data.qr_code);
        setQrCodeImg(mpData.point_of_interaction.transaction_data.qr_code_base64);
        setPaymentId(mpData.id); 
        setTelaAtual('pix');
        setTempoRestante(900); 
      } else {
        throw new Error("Erro ao gerar o PIX. Verifique a configuração.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(qrCodePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000); 
  };

  const reiniciarCompra = () => {
    window.location.reload();
  };

  // TELA DE ADMIN LOGIN
  if (telaAtual === 'login_admin') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none"></div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <Lock size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Acesso Restrito</h2>
            </div>
            <form onSubmit={handleLoginAdmin} className="space-y-6">
              <div className="space-y-2">
                <input type="password" autoFocus placeholder="SENHA MESTRE" value={senhaAdmin} onChange={(e) => setSenhaAdmin(e.target.value)} className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-5 py-4 text-white text-center text-lg font-mono tracking-[0.2em] outline-none focus:border-emerald-500" />
              </div>
              {erroLoginAdmin && <div className="text-red-500 text-xs font-bold text-center animate-in shake">{erroLoginAdmin}</div>}
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all uppercase tracking-widest text-xs">Desbloquear Cofre</button>
            </form>
            <button onClick={() => setTelaAtual('formulario')} className="w-full mt-6 text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"><ArrowLeft size={12} /> Voltar</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // TELA ADMIN
  if (telaAtual === 'admin') return <Admin senha={senhaAdmin} formatarMoeda={formatarMoeda} fecharAdmin={() => setTelaAtual('formulario')} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 overflow-x-hidden">
      
      {/* MODAL DE IMAGEM */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-pointer" onClick={() => setSelectedImg(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={32}/></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={selectedImg} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO SECTION (TOPO) */}
      <HeroSection 
        vagasOcupadas={vagasOcupadas} 
        LIMITE_VAGAS={LIMITE_VAGAS} 
        scrollToForm={scrollToForm} 
        images={images} 
      />

      <main className="container mx-auto px-4 md:px-6 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* 2. COLUNA DA ESQUERDA (INFORMAÇÕES) */}
          <EventInfo 
            images={images} 
            setSelectedImg={setSelectedImg} 
          />

          <div className="lg:col-span-1 mt-10 lg:mt-0">
            <section id="inscricao" className="lg:sticky lg:top-8 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
              
              {/* ESTADO 1: VERIFICANDO VAGAS */}
              {verificandoVagas ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Verificando Vagas...</p>
                </div>
              ) : 
              
              /* ESTADO 2: VAGAS ESGOTADAS -> LISTA DE ESPERA VIP */
              vagasOcupadas >= LIMITE_VAGAS && telaAtual === 'formulario' ? (
                <div className="animate-in fade-in zoom-in duration-500">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                      <Hourglass size={28} className="text-red-500" />
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">ESGOTADO!</h2>
                    <p className="text-zinc-400 text-xs font-bold mt-2">Todas as vagas foram preenchidas.</p>
                  </div>
                  
                  {!entrouLista ? (
                    <div className="bg-zinc-800/40 p-6 rounded-3xl border border-zinc-700/50 shadow-inner">
                      <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center mb-6">Lista de Espera VIP</h3>
                      <form onSubmit={handleListaEspera} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Seu Nome</label>
                          <input required type="text" value={listaEsperaNome} onChange={e => setListaEsperaNome(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700/50 rounded-xl px-4 py-3 text-white font-bold text-sm" placeholder="Nome e Sobrenome" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Seu WhatsApp</label>
                          <input required type="tel" value={listaEsperaFone} onChange={e => {
                            let v = e.target.value.replace(/\D/g, "").slice(0, 11);
                            if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                            if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
                            setListaEsperaFone(v);
                          }} className="w-full bg-zinc-950 border border-zinc-700/50 rounded-xl px-4 py-3 text-white font-bold text-sm" placeholder="(81) 99999-9999" />
                        </div>
                        <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-4 rounded-xl shadow-xl mt-4 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all">
                          Entrar na Lista VIP <ChevronRight size={16}/>
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-3xl text-center space-y-4">
                      <CheckCircle className="text-emerald-500 mx-auto" size={40} />
                      <p className="text-emerald-400 font-bold text-sm">Você foi adicionado à lista de espera com sucesso!</p>
                      <p className="text-zinc-400 text-xs">Se alguma vaga abrir, entraremos em contato com você via WhatsApp.</p>
                    </div>
                  )}
                </div>
              ) : 
              
              /* ESTADO 3: FORMULÁRIO NORMAL DE COMPRA */
              telaAtual === 'formulario' ? (
                <>
                  <div className="text-center mb-10 relative">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">INSCRIÇÃO</h2>
                    <p className="text-emerald-500 text-sm font-bold mt-2 tracking-widest">R$ 50 INDIVIDUAL | R$ 90 VOCÊ + 1 AMIGO</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* === FORMULÁRIO DINÂMICO PARA TITULAR E ACOMPANHANTES === */}
                    {participants.map((participant, index) => (
                      <div key={index} className="p-6 rounded-3xl bg-zinc-800/40 border border-zinc-700/50 relative shadow-inner overflow-hidden">
                        
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${index === 0 ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>

                        <div className="flex justify-between items-center mb-4 pl-2 border-b border-zinc-700/50 pb-2">
                          <h3 className={`text-[10px] font-black uppercase tracking-widest ${index === 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                            {index === 0 ? "👤 Titular da Inscrição (Responsável)" : `👥 Acompanhante ${index}`}
                          </h3>
                          {index > 0 && (
                            <button type="button" onClick={() => removeParticipant(index)} className="text-zinc-500 hover:text-red-500 transition-colors p-1" title="Remover Acompanhante"><Trash2 size={16} /></button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Nome Completo</label>
                            <input type="text" value={participant.name} onChange={e => updateParticipant(index, 'name', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="Ex: João Silva" />
                          </div>

                          {index === 0 && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">WhatsApp</label>
                                  <input type="tel" value={participant.phone} onChange={e => updateParticipant(index, 'phone', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="(81) 99999-9999" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">CPF (Necessário para a compra)</label>
                                  <input type="text" required value={participant.cpf} onChange={e => updateParticipant(index, 'cpf', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="000.000.000-00" />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">E-mail</label>
                                <input type="email" value={participant.email} onChange={e => updateParticipant(index, 'email', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="seu@gmail.com" />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Contato de Emergência (SOS)</label>
                                <div className="grid grid-cols-2 gap-3">
                                  <input type="text" value={participant.emergencyName} onChange={e => updateParticipant(index, 'emergencyName', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="Nome" />
                                  <input type="tel" value={participant.emergencyPhone} onChange={e => updateParticipant(index, 'emergencyPhone', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="(81) 99999-9999" />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {vagasOcupadas + participants.length < LIMITE_VAGAS && (
                       <button type="button" onClick={addParticipant} className="w-full py-4 border-2 border-dashed border-zinc-600 rounded-2xl text-zinc-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"><Plus size={16} /> Comprar Ingresso Extra (Acompanhante)</button>
                    )}

                    <label className="flex items-start gap-3 pt-6 border-t border-zinc-700/50 cursor-pointer group">
                      <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 h-5 w-5 accent-emerald-500 cursor-pointer rounded shrink-0 group-hover:ring-2 ring-emerald-500/50 transition-all" />
                      <span className="text-[11px] text-zinc-400 font-bold leading-relaxed select-none group-hover:text-zinc-300 transition-colors">
                        Aceito o Termo de Responsabilidade (declaro estar em boas condições de saúde) e estou ciente de que NÃO haverá devolução ou reembolso do valor pago sob nenhuma hipótese.
                      </span>
                    </label>

                    {errorMsg && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2"><AlertCircle size={14}/> {errorMsg}</div>}
                    
                    <button disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-sm mt-4">
                      {loading ? <Loader2 className="animate-spin" /> : <>Finalizar Inscrição (R$ {formatarMoeda(calcularValorIngressos(participants.length) + taxaPix)}) <ChevronRight size={20} /></>}
                    </button>
                  </form>
                </>
              ) : (
                /* ESTADO 4: TELA DO PIX OU SUCESSO */
                <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  {statusPagamento === 'pago' ? (
                    <div className="py-2 space-y-6 flex flex-col items-center">
                      <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                        <CheckCircle size={40} className="text-white" />
                      </div>
                      <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">Pagamento <br /> Confirmado!</h2>
                      <p className="text-zinc-400 font-bold text-sm max-w-xs mx-auto">
                        O comprovante e os detalhes da sua inscrição foram enviados para o e-mail: <strong className="text-emerald-500">{participants[0].email}</strong>
                      </p>

                      <div className="space-y-4 text-left w-full max-w-md mx-auto pt-4 pb-2">
                        {participants.map((p, index) => (
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.2 }} key={index} 
                            className="bg-zinc-900/80 p-4 rounded-xl border border-emerald-500/20 flex items-center gap-4"
                          >
                            <div className="bg-emerald-500/10 p-3 rounded-lg">
                              <Ticket className="text-emerald-500" size={24} />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">
                                {index === 0 ? "Titular" : "Acompanhante"}
                              </p>
                              <p className="text-white font-bold uppercase truncate">{p.name}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <button onClick={reiniciarCompra} className="mt-8 px-6 py-3 border border-zinc-700 hover:border-emerald-500 rounded-xl text-zinc-400 hover:text-emerald-500 text-xs font-bold uppercase tracking-widest transition-all">
                        Fazer Nova Inscrição
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2"><QrCode className="text-emerald-500 w-10 h-10" /></div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Escaneie o PIX</h2>
                      </div>
                      {qrCodeImg && (
                        <div className="flex justify-center my-6"><div className="bg-white p-3 rounded-2xl border-4 border-emerald-500/30"><img src={`data:image/jpeg;base64,${qrCodeImg}`} alt="PIX" className="w-48 h-48 rounded-lg" /></div></div>
                      )}
                      <div className="bg-zinc-800/40 border border-emerald-500/30 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                        <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest mb-2">Valor total</p>
                        <p className="text-5xl font-black text-white tracking-tighter">R$ {formatarMoeda(calcularValorIngressos(participants.length) + taxaPix)}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 bg-zinc-950 p-2 pl-4 rounded-xl border border-zinc-700/50">
                          <span className="text-xs font-mono text-zinc-300 truncate w-full text-left">{qrCodePix}</span>
                          <button onClick={copiarPix} className={`px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${copiado ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
                            {copiado ? <CheckCircle size={14} /> : <Copy size={14} />} 
                            {copiado ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        {tempoRestante > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 mt-4">
                            <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold animate-pulse">Aguardando pagamento...</p>
                            <div className="flex items-center gap-2 text-2xl font-mono bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 text-white"><Clock size={20} className="text-emerald-500" /><span>{formatarTempo(tempoRestante)}</span></div>
                            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Tempo para o PIX expirar</p>
                          </div>
                        ) : (
                          <div className="text-red-500 font-bold text-xs mt-4 bg-red-500/10 p-4 rounded-xl border border-red-500/30">Tempo expirado! Por favor, recarregue a página e gere uma nova inscrição.</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* 3. RODAPÉ */}
      <Footer />
    </div>
  );
};

export default Trilha3Reinos;