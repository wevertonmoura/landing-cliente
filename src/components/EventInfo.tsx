// src/components/EventInfo.tsx

import { Calendar, MapPin, Trophy, Clock, Mountain, Droplets, Info, Trash2, ShieldCheck, Waves, Maximize2, Ticket, VolumeX, QrCode, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';

const InfoRow = ({ icon, title, text }: any) => (
  <div className="flex items-start gap-5">
    <div className="text-emerald-500 mt-1">{icon}</div>
    <div>
      <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">{title}</h4>
      <p className="text-white font-bold text-xl leading-tight">{text}</p>
    </div>
  </div>
);

const CheckItem = ({ text, icon }: any) => (
  <div className="flex items-center gap-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 shadow-sm">
    <span className="text-emerald-500 shrink-0">{icon}</span>
    <span className="text-xs font-bold text-zinc-300">{text}</span>
  </div>
);

interface EventInfoProps {
  images: string[];
  setSelectedImg: (img: string) => void;
}

export default function EventInfo({ images, setSelectedImg }: EventInfoProps) {
  return (
    <div className="lg:col-span-2 space-y-16">
      <section>
        <h2 className="text-2xl font-black uppercase italic mb-6 border-b border-zinc-900 pb-2 text-zinc-500">Descrição do evento</h2>
        <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
          <p className="text-white font-bold italic">Trilha Santuário Dos três reinos</p>
          <p>Precisa dar uma pausa na rotina? O projeto <span className="text-white font-bold text-emerald-500">Vem Para Trilha</span> preparou uma manhã de imersão completa na natureza para você respirar novos ares.</p>
          <p>Nossa rota foi cuidadosamente desenhada para unir o desafio da caminhada com a paz da contemplação. Venha gastar energia na trilha e fechar a experiência com um refrescante banho de rio.</p>
        </div>
        <div className="mt-10">
          <h2 className="text-xl font-black uppercase italic mb-6 text-zinc-500 tracking-widest">Explore o Cenário</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, i) => (
              <motion.div key={i} whileHover={{ scale: 1.05 }} className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-lg border border-zinc-900" onClick={() => setSelectedImg(img)}>
                <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Maximize2 className="text-white" size={24} /></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="col-span-full"><h2 className="text-2xl font-black uppercase italic mb-6 border-b border-zinc-900 pb-2 text-zinc-500">Sobre o evento</h2></div>
        <InfoRow icon={<Calendar />} title="Data" text="14 de Junho de 2026" />
        <InfoRow icon={<Clock />} title="Horário" text="07:00 às 12:00" />
        <a href="https://www.google.com/maps/place/?q=place_id:ChIJ4-tYpb8RqwcRxSQFPEP7it4" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><InfoRow icon={<MapPin className="text-emerald-500" />} title="Localização" text="Guabiraba, Recife - PE" /></a>
        <InfoRow icon={<Trophy />} title="Investimento" text="R$ 50 Individual | R$ 90 (Você + 1 Amigo)" />
      </section>

      <section>
        <h2 className="text-2xl font-black uppercase italic mb-6 border-b border-zinc-900 pb-2 text-zinc-500">O QUE LEVAR? (RECOMENDAÇÕES)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CheckItem icon={<Droplets />} text="Água (pelo menos 1,5 litro)" />
          <CheckItem icon={<ShieldCheck />} text="Protetor solar e repelente" />
          <CheckItem icon={<Waves />} text="Roupa de banho e toalha" />
          <CheckItem icon={<Info />} text="Boné ou chapéu" />
          <CheckItem icon={<Mountain />} text="Calçados confortáveis" />
          <CheckItem icon={<Trash2 />} text="Sacola para seu lixo" />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase italic mb-6 text-emerald-500 tracking-tighter">INFORMAÇÕES IMPORTANTES</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 flex gap-5 col-span-1 md:col-span-2 shadow-inner">
            <ShieldCheck className="text-red-500 shrink-0" size={32}/>
            <div>
              <h4 className="font-bold text-red-500 uppercase text-sm mb-2 tracking-widest">Acesso Restrito (Sem Penetra)</h4>
              <p className="text-sm text-zinc-300 leading-relaxed">A área do evento é uma <strong className="text-white">propriedade privada</strong>. Somente pessoas com o nome na lista oficial de pagantes poderão entrar.</p>
            </div>
          </div>
          <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5"><Ticket className="text-emerald-500 shrink-0" size={32}/><div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Investimento</h4><p className="text-sm text-zinc-400 leading-relaxed">R$ 50,00 (Individual) ou R$ 90,00 (Você + 1 Amigo). Vagas limitadas.</p></div></div>
          <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5"><VolumeX className="text-emerald-500 shrink-0" size={32}/><div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Som e Natureza</h4><p className="text-sm text-zinc-400 leading-relaxed">Não é permitido o uso de caixas de som em volume alto.</p></div></div>
          <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5"><QrCode className="text-emerald-500 shrink-0" size={32}/><div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Pagamento via PIX</h4><p className="text-sm text-zinc-400 leading-relaxed">Confirmação automática via PIX. Acréscimo de taxa de <strong className="text-emerald-500">R$ 1,00</strong>.</p></div></div>
          <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5"><Coffee className="text-emerald-500 shrink-0" size={32}/><div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Café Coletivo</h4><p className="text-sm text-zinc-400 leading-relaxed">Pedimos que cada participante leve um item para compartilhar.</p></div></div>
        </div>
      </section>
    </div>
  );
}