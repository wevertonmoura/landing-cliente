import React from 'react';
import { CheckCircle, QrCode, Copy, Clock, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

interface TelaPixProps {
  statusPagamento: 'pendente' | 'pago';
  participants: any[];
  reiniciarCompra: () => void;
  qrCodeImg: string;
  qrCodePix: string;
  copiado: boolean;
  copiarPix: () => void;
  tempoRestante: number;
  formatarTempo: (segundos: number) => string;
  valorTotal: number;
  formatarMoeda: (valor: number) => string;
}

const TelaPix: React.FC<TelaPixProps> = ({
  statusPagamento, participants, reiniciarCompra, qrCodeImg, qrCodePix,
  copiado, copiarPix, tempoRestante, formatarTempo, valorTotal, formatarMoeda
}) => {
  return (
    <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
      {statusPagamento === 'pago' ? (
        <div className="py-2 space-y-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(250,204,21,0.4)]">
            <CheckCircle size={40} className="text-[#020412]" />
          </div>
          <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">Pagamento <br /> Confirmado!</h2>
          <p className="text-blue-200 font-bold text-sm max-w-xs mx-auto">
            O comprovante e os detalhes da sua inscrição foram enviados para o e-mail: <strong className="text-yellow-400">{participants[0]?.email}</strong>
          </p>

          <div className="space-y-4 text-left w-full max-w-md mx-auto pt-4 pb-2">
            {participants.map((p, index) => (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.2 }} key={index} className="bg-blue-900/30 p-4 rounded-xl border border-blue-800/50 flex items-center gap-4">
                <div className="bg-yellow-400/20 p-3 rounded-lg">
                  <Ticket className="text-yellow-400" size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-blue-300 font-bold tracking-widest">
                    {index === 0 ? "Titular" : "Acompanhante"}
                  </p>
                  <p className="text-white font-bold uppercase truncate">{p.name}</p>
                  {p.equipe && <p className="text-[10px] text-blue-400 truncate">Equipe: {p.equipe}</p>}
                </div>
              </motion.div>
            ))}
          </div>

          <button onClick={reiniciarCompra} className="mt-8 px-6 py-3 border border-blue-800/50 hover:border-yellow-400 rounded-xl text-blue-300 hover:text-yellow-400 text-xs font-bold uppercase tracking-widest transition-all">
            Fazer Nova Inscrição
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mb-2">
              <QrCode className="text-yellow-400 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Escaneie o PIX</h2>
          </div>
          {qrCodeImg && (
            <div className="flex justify-center my-6">
              <div className="bg-white p-3 rounded-2xl border border-blue-800 shadow-sm">
                <img src={`data:image/jpeg;base64,${qrCodeImg}`} alt="PIX" className="w-48 h-48 rounded-lg" />
              </div>
            </div>
          )}
          <div className="bg-blue-900/30 border border-blue-800/50 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500"></div>
            <p className="text-xs font-bold uppercase text-blue-300 tracking-widest mb-2">Valor total</p>
            <p className="text-5xl font-black text-white tracking-tighter">R$ {formatarMoeda(valorTotal)}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-[#020412] p-2 pl-4 rounded-xl border border-blue-800/80">
              <span className="text-xs font-mono text-blue-200 truncate w-full text-left">{qrCodePix}</span>
              <button onClick={copiarPix} className={`px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${copiado ? 'bg-yellow-400 text-[#020412]' : 'bg-blue-800/50 hover:bg-blue-700 text-white'}`}>
                {copiado ? <CheckCircle size={14} /> : <Copy size={14} />} 
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            {tempoRestante > 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 mt-4">
                <p className="text-[10px] uppercase tracking-widest text-yellow-400 font-bold animate-pulse">Aguardando pagamento...</p>
                <div className="flex items-center gap-2 text-2xl font-mono bg-blue-900/30 px-4 py-2 rounded-xl border border-blue-800/50 text-white">
                  <Clock size={20} className="text-yellow-400" />
                  <span>{formatarTempo(tempoRestante)}</span>
                </div>
                <p className="text-[9px] uppercase tracking-wider text-blue-300 font-bold">Tempo para o PIX expirar</p>
              </div>
            ) : (
              <div className="text-red-400 font-bold text-xs mt-4 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                Tempo expirado! Por favor, recarregue a página e gere uma nova inscrição.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TelaPix;