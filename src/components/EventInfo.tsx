import React from 'react';
import { Calendar, MapPin, Trophy, Clock, Mountain, Droplets, Info, Trash2, ShieldCheck, Waves, Maximize2, Ticket, QrCode, Coffee, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

const InfoRow = ({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) => (
  <div className="flex items-start gap-5">
    <div className="text-yellow-400 mt-1">{icon}</div>
    <div>
      <h4 className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-1">{title}</h4>
      <p className="text-white font-bold text-xl leading-tight">{text}</p>
    </div>
  </div>
);

const CheckItem = ({ text, icon }: { text: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 bg-blue-900/40 p-4 rounded-xl border border-blue-700/50 shadow-sm">
    <span className="text-yellow-400 shrink-0">{icon}</span>
    <span className="text-xs font-bold text-blue-50">{text}</span>
  </div>
);

interface EventInfoProps {
  images: string[];
  setSelectedImg: (img: string) => void;
}

export default function EventInfo({ images, setSelectedImg }: EventInfoProps) {
  return (
    <div className="lg:col-span-2 space-y-16">
      
      {/* DESCRIÇÃO DO EVENTO */}
      <section>
        <h2 className="text-2xl font-black uppercase italic mb-6 border-b border-blue-800/50 pb-2 text-blue-200">Descrição do evento</h2>
        
        <div className="space-y-6 text-blue-100 text-lg leading-relaxed">
          <p className="text-white font-bold italic">Pausa na rotina?</p>
          <p>O <span className="text-yellow-400 font-black">TRAILL OS D'SEMPRE</span> te chama pra uma manhã de imersão na Natureza.</p>
          <p>Rota pensada pra desafiar seu corpo e acalmar sua mente. Começa na trilha, termina no banho de Rios, Cachoeira, Etc. Respira Fundo. Sente o mato. Renova a Energia.</p>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-black uppercase italic mb-6 text-blue-200 tracking-widest">Explore o Cenário</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, i) => (
              <motion.div key={i} whileHover={{ scale: 1.05 }} className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-md border border-blue-800/50 bg-blue-900/50" onClick={() => setSelectedImg(img)}>
               <img src={img} alt="Cenário do evento" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Maximize2 className="text-white drop-shadow-md" size={24} /></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE O EVENTO */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="col-span-full"><h2 className="text-2xl font-black uppercase italic mb-6 border-b border-blue-800/50 pb-2 text-blue-200">Sobre o evento</h2></div>
        <InfoRow icon={<Calendar />} title="Data" text="28 de Junho de 2026" />
        <InfoRow icon={<Clock />} title="Horários" text="Concentração: 05:30 | Largada: 06:30" />
        <a href="#" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
          <InfoRow icon={<MapPin className="text-yellow-400" />} title="Localização" text="Jaboatão dos Guararapes (Suassuna) - Próximo ao engenho Palmeiras" />
        </a>
        <div className="flex items-start gap-5">
    {/* Ícone com a cor amarela mantida apenas no desenho */}
    <div className="text-yellow-400 mt-1"><Navigation /></div>
    <div>
        <h4 className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-1">Ponto de Encontro</h4>
        {/* Mancha amarela removida. Texto alterado para branco (text-white) para dar leitura */}
        <p className="text-white font-bold text-xl leading-tight">Aconchego Família Rural</p>
    </div>
</div>
        <InfoRow icon={<Trophy />} title="Investimento" text="R$ 40 Individual | R$ 35 (Equipes +10)" />
      </section>

      {/* O QUE LEVAR */}
      <section>
        <h2 className="text-2xl font-black uppercase italic mb-6 border-b border-blue-800/50 pb-2 text-blue-200">O QUE LEVAR? (RECOMENDAÇÕES)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CheckItem icon={<Droplets />} text="Água (pelo menos 1,5 litro)" />
          <CheckItem icon={<ShieldCheck />} text="Protetor solar e repelente" />
          <CheckItem icon={<Waves />} text="Roupa de banho e toalha" />
          <CheckItem icon={<Info />} text="Boné ou chapéu" />
          <CheckItem icon={<Mountain />} text="Calçados confortáveis" />
          <CheckItem icon={<Trash2 />} text="Sacola para seu lixo" />
        </div>
      </section>

      {/* DIFERENCIAIS E VALORES */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase italic mb-6 text-yellow-400 tracking-tighter">Diferenciais e Valores</h2>
        <div className="grid md:grid-cols-2 gap-6">
          
          <div className="bg-blue-900/50 shadow-sm p-6 rounded-2xl border border-blue-800/60 flex gap-5">
            <Coffee className="text-yellow-400 shrink-0" size={32}/>
            <div>
              <h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Pós-Trilha</h4>
              <p className="text-sm text-blue-100 leading-relaxed">Mesa de frutas liberada para todos os atletas após o percurso para repor as energias.</p>
            </div>
          </div>

          <div className="bg-blue-900/50 shadow-sm p-6 rounded-2xl border border-blue-800/60 flex gap-5">
            <Trophy className="text-yellow-400 shrink-0" size={32}/>
            <div>
              <h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Premiação</h4>
              <p className="text-sm text-blue-100 leading-relaxed">Troféu especial para as 3 maiores equipes participantes. Monte seu time!</p>
            </div>
          </div>

          <div className="bg-blue-900/50 shadow-sm p-6 rounded-2xl border border-blue-800/60 flex gap-5">
            <Ticket className="text-yellow-400 shrink-0" size={32}/>
            <div>
              <h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Valores de Inscrição</h4>
              <p className="text-sm text-blue-100 leading-relaxed">
                Individual: <strong>R$ 40,00</strong><br />
                Equipes (+10 atletas): <strong>R$ 35,00 cada</strong>
              </p>
            </div>
          </div>

          <div className="bg-blue-900/50 shadow-sm p-6 rounded-2xl border border-blue-800/60 flex gap-5">
            <QrCode className="text-yellow-400 shrink-0" size={32}/>
            <div>
              <h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Taxa de Serviço</h4>
              <p className="text-sm text-blue-100 leading-relaxed">Será acrescido o valor de <strong>R$ 5,00</strong> de taxa de conveniência do site por inscrição.</p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}