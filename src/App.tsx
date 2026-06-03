import React, { useState, useEffect } from 'react';
import { Loader2, X, ChevronRight, Hourglass, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORTAÇÕES DOS COMPONENTES
import Admin from './Admin';
import { validarCPF, formatarMoeda } from './utils/helpers';
import HeroSection from './components/HeroSection';
import EventInfo from './components/EventInfo';
import Footer from './components/Footer';
import FormularioInscricao from './components/FormularioInscricao';
import TelaPix from './components/TelaPix';

const OsDSempreTrilha = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  
  const [telaAtual, setTelaAtual] = useState<'formulario' | 'pix' | 'login_admin' | 'admin'>('formulario');
  const [statusPagamento, setStatusPagamento] = useState<'pendente' | 'pago'>('pendente');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [erroLoginAdmin, setErroLoginAdmin] = useState('');

  const LIMITE_VAGAS = 9999999;
  const [vagasOcupadas, setVagasOcupadas] = useState(0);
  const [verificandoVagas, setVerificandoVagas] = useState(true);
  const [listaEsperaNome, setListaEsperaNome] = useState('');
  const [listaEsperaFone, setListaEsperaFone] = useState('');
  const [entrouLista, setEntrouLista] = useState(false);

  // --- ATUALIZAÇÃO DE VALORES ---
  const taxaPix = 5; // Atualizado para R$ 5,00
  
  const calcularValorIngressos = (qtd: number) => {
    // Se a equipe tiver 10 ou mais atletas, cobra R$ 35 por pessoa. Senão, R$ 40.
    if (qtd >= 10) {
      return qtd * 35;
    }
    return qtd * 40;
  };
  // ------------------------------

  const [participants, setParticipants] = useState([
    { name: '', email: '', phone: '', cpf: '', emergencyName: '', emergencyPhone: '', equipe: '' }
  ]);

  const valorTotalCalculado = calcularValorIngressos(participants?.length || 1) + taxaPix;

  const [qrCodePix, setQrCodePix] = useState(''); 
  const [qrCodeImg, setQrCodeImg] = useState(''); 
  const [copiado, setCopiado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(900); 

  // Imagens atualizadas para o cenário de trilha e cachoeira
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
      alert("Atenção: Vagas insuficientes para adicionar outro atleta!");
      return;
    }
    setParticipants([...participants, { name: '', email: '', phone: '', cpf: '', emergencyName: '', emergencyPhone: '', equipe: '' }]);
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
    const msg = `🚀 *LISTA VIP - OS D'SEMPRE* 🚀%0A%0A*Nome:* ${listaEsperaNome}%0A*WhatsApp:* ${listaEsperaFone}%0A%0AOlá! Vi que as vagas esgotaram. Gostaria de entrar na lista de espera caso alguém desista!`;
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
      if (p.name.trim().length < 3) { setErrorMsg(i === 0 ? `Preencha o nome do Titular.` : `Preencha o nome do Atleta ${i + 1}.`); return; }
      
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

      const response = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantes: participants,
          valorTotal: valorTotalCalculado,
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

  if (telaAtual === 'login_admin') {
    return (
      <div className="min-h-screen w-full bg-[#020412] text-white font-sans selection:bg-yellow-400 selection:text-black overflow-x-hidden">
        <form onSubmit={handleLoginAdmin} className="bg-blue-900/20 p-8 rounded-3xl border border-blue-800/50 shadow-xl max-w-sm w-full space-y-4 backdrop-blur-sm">
          <h2 className="text-2xl font-black text-white uppercase text-center mb-6">Acesso Restrito</h2>
          <input type="password" value={senhaAdmin} onChange={e => setSenhaAdmin(e.target.value)} className="w-full bg-[#020412] border border-blue-800 rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none" placeholder="Senha de Admin" />
          {erroLoginAdmin && <p className="text-red-400 text-xs font-bold text-center">{erroLoginAdmin}</p>}
          <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-[#020412] font-black py-3 rounded-xl uppercase transition-colors">Entrar</button>
        </form>
      </div>
    );
  }

  if (telaAtual === 'admin') return <Admin senha={senhaAdmin} formatarMoeda={formatarMoeda} fecharAdmin={() => setTelaAtual('formulario')} />;

  return (
    <div className="min-h-screen w-full bg-[#020412] text-white font-sans selection:bg-yellow-400 selection:text-black overflow-x-hidden">
      
      <AnimatePresence>
        {selectedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setSelectedImg(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={32}/></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={selectedImg} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

      <HeroSection vagasOcupadas={vagasOcupadas} LIMITE_VAGAS={LIMITE_VAGAS} scrollToForm={scrollToForm} images={images} />

      <main className="container mx-auto px-4 md:px-6 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          <EventInfo images={images} setSelectedImg={setSelectedImg} />

          <div className="lg:col-span-1 mt-10 lg:mt-0">
            <section id="inscricao" className="lg:sticky lg:top-8 bg-blue-900/10 backdrop-blur-md border border-blue-800/30 rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
              
              {verificandoVagas ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-70">
                  <Loader2 className="animate-spin text-yellow-400 mb-4" size={40} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Verificando Vagas...</p>
                </div>
              ) : vagasOcupadas >= LIMITE_VAGAS && telaAtual === 'formulario' ? (
                <div className="animate-in fade-in zoom-in duration-500">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                      <Hourglass size={28} className="text-red-400" />
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">ESGOTADO!</h2>
                    <p className="text-blue-200 text-xs font-bold mt-2">Todas as vagas foram preenchidas.</p>
                  </div>
                  
                  {!entrouLista ? (
                    <div className="bg-blue-950/40 p-6 rounded-3xl border border-blue-800/50 shadow-inner">
                      <h3 className="text-yellow-400 text-[10px] font-black uppercase tracking-widest text-center mb-6">Lista de Espera VIP</h3>
                      <form onSubmit={handleListaEspera} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-blue-300 ml-1">Seu Nome</label>
                          <input required type="text" value={listaEsperaNome} onChange={e => setListaEsperaNome(e.target.value)} className="w-full bg-[#020412] border border-blue-800 rounded-xl px-4 py-3 text-white font-bold text-sm" placeholder="Nome e Sobrenome" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-blue-300 ml-1">Seu WhatsApp</label>
                          <input required type="tel" value={listaEsperaFone} onChange={e => {
                            let v = e.target.value.replace(/\D/g, "").slice(0, 11);
                            if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                            if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
                            setListaEsperaFone(v);
                          }} className="w-full bg-[#020412] border border-blue-800 rounded-xl px-4 py-3 text-white font-bold text-sm" placeholder="(81) 99999-9999" />
                        </div>
                        <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-[#020412] font-black py-4 rounded-xl shadow-xl mt-4 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all">
                          Entrar na Lista VIP <ChevronRight size={16}/>
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-yellow-400/10 border border-yellow-400/20 p-6 rounded-3xl text-center space-y-4">
                      <CheckCircle className="text-yellow-400 mx-auto" size={40} />
                      <p className="text-yellow-400 font-bold text-sm">Você foi adicionado à lista de espera!</p>
                      <p className="text-blue-200 text-xs">Se alguma vaga abrir, entraremos em contato via WhatsApp.</p>
                    </div>
                  )}
                </div>
              ) : telaAtual === 'formulario' ? (
                <FormularioInscricao 
                  participants={participants}
                  updateParticipant={updateParticipant}
                  removeParticipant={removeParticipant}
                  addParticipant={addParticipant}
                  vagasOcupadas={vagasOcupadas}
                  LIMITE_VAGAS={LIMITE_VAGAS}
                  termsAccepted={termsAccepted}
                  setTermsAccepted={setTermsAccepted}
                  errorMsg={errorMsg}
                  loading={loading}
                  handleSubmit={handleSubmit}
                  valorTotal={valorTotalCalculado}
                  formatarMoeda={formatarMoeda}
                />
              ) : (
                <TelaPix 
                  statusPagamento={statusPagamento}
                  participants={participants}
                  reiniciarCompra={reiniciarCompra}
                  qrCodeImg={qrCodeImg}
                  qrCodePix={qrCodePix}
                  copiado={copiado}
                  copiarPix={copiarPix}
                  tempoRestante={tempoRestante}
                  formatarTempo={formatarTempo}
                  valorTotal={valorTotalCalculado}
                  formatarMoeda={formatarMoeda}
                />
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OsDSempreTrilha;