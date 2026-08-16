import React from 'react';
import { 
  Calendar, MapPin, Trophy, Clock, 
  Medal, Users, Sun, Heart, Droplet, Ticket 
} from 'lucide-react';

// Componente auxiliar para os itens do Kit
const CheckItem = ({ text, icon }: { text: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 bg-blue-900/40 p-4 rounded-xl border border-blue-700/50 shadow-sm">
    <span className="text-yellow-400 shrink-0">{icon}</span>
    <span className="text-xs font-bold text-blue-50">{text}</span>
  </div>
);

export default function EventInfo() {
  return (
    <div className="lg:col-span-2 space-y-16">
      
      {/* DESCRIÇÃO DO EVENTO */}
      <section>
        <h2 className="text-3xl md:text-4xl font-black uppercase italic mb-6 border-b border-blue-800/50 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
          Corrida de Aniversário <br/> OS D’SEMPRE 💨
        </h2>
        
        <div className="space-y-6 text-blue-100 text-lg leading-relaxed">
          <p className="text-white font-bold italic">Prepare a energia, o tênis e o sorriso! 😍</p>
          <p>
            A <span className="text-yellow-400 font-black">Corrida de Aniversário OS D’SEMPRE</span> chega para celebrar a vida, a amizade e a saúde em um verdadeiro festival de movimento, superação e alegria.
          </p>
          <p>
            É o momento de reunir a galera, ocupar as ruas com boas vibrações e transformar a manhã em uma grande festa da corrida! 🏃‍♀️💙💛
          </p>
        </div>
      </section>

      {/* INFORMAÇÕES E VALORES (LADO A LADO NO DESKTOP) */}
      <section className="grid md:grid-cols-2 gap-6">
        
        {/* LOCAL E HORA */}
        <div className="bg-blue-950/40 border border-blue-900/50 p-8 rounded-3xl shadow-xl">
          <h3 className="text-xl font-black uppercase tracking-widest text-blue-300 mb-6 flex items-center gap-2">
            <MapPin className="text-yellow-400" /> Informações
          </h3>
          <ul className="space-y-5 font-medium text-blue-100">
            <li className="flex items-center gap-4"><Calendar className="text-blue-400" size={24}/> <div><p className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">Data</p><strong className="text-white text-lg">29 de novembro</strong></div></li>
            <li className="flex items-center gap-4"><MapPin className="text-blue-400" size={24}/> <div><p className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">Local</p><strong className="text-white text-lg">Terminal da UR-11</strong></div></li>
            <li className="flex items-center gap-4"><Clock className="text-blue-400" size={24}/> <div><p className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">Concentração</p><strong className="text-white text-lg">05h00</strong></div></li>
            <li className="flex items-center gap-4"><Sun className="text-yellow-400" size={24}/> <div><p className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold">Aquecimento</p><strong className="text-white text-lg">05h30</strong></div></li>
            <li className="flex items-center gap-4"><Users className="text-emerald-400" size={24}/> <div><p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Largada Oficial</p><strong className="text-white text-lg">06h00</strong></div></li>
          </ul>
        </div>

        {/* PREÇOS COM GATILHO DE URGÊNCIA E TAXA EXPLÍCITA */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-500 text-[#020412] text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
            Vagas Limitadas
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest text-yellow-400 mb-6 flex items-center gap-2">
            <Ticket /> Inscrições
          </h3>
          
          <div className="space-y-4">
            {/* 🚀 1 LOTE ATUALIZADO */}
            <div className="bg-[#020412]/50 p-5 rounded-xl border border-yellow-500/30">
              <h4 className="text-white font-black flex items-center gap-2 mb-3">🥇 1º LOTE <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">Ativo</span></h4>
              <p className="text-sm text-blue-200 mb-1">• Individual: <strong className="text-yellow-400 text-xl">R$ 70,00</strong> <span className="text-[10px] text-blue-300 font-bold">+ R$ 5,00 de taxa do site</span></p>
              <p className="text-sm text-blue-200">• Equipe (10+): <strong className="text-yellow-400 text-xl">R$ 65,00</strong> <span className="text-[10px] text-blue-300 font-bold">/pessoa + R$ 5,00 de taxa do site</span></p>
            </div>

            {/* 🚀 2 LOTE ATUALIZADO - BLOQUEADO VISUALMENTE */}
            <div className="bg-[#020412]/20 p-5 rounded-xl border border-blue-900/30 opacity-60 grayscale">
              <h4 className="text-white font-black flex items-center gap-2 mb-3">🥈 2º LOTE <span className="text-[10px] bg-blue-900 text-blue-300 px-2 py-0.5 rounded uppercase">Em Breve</span></h4>
              <p className="text-sm text-blue-200 mb-1">• Individual: <strong className="text-lg">R$ 80,00</strong> <span className="text-[10px] text-blue-300 font-bold">+ R$ 5,00 de taxa do site</span></p>
              <p className="text-sm text-blue-200">• Equipe: <strong className="text-lg">R$ 75,00</strong> <span className="text-[10px] text-blue-300 font-bold">/pessoa + R$ 5,00 de taxa do site</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* O QUE ESTÁ INCLUSO? */}
      <section>
        <h2 className="text-2xl font-black uppercase italic mb-6 border-b border-blue-800/50 pb-2 text-blue-200">🎁 O que está incluso?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CheckItem icon={<Medal size={20} />} text="Medalha para todos os inscritos" />
          <CheckItem icon={<Ticket size={20} />} text="Número de Peito" />
          <CheckItem icon={<Trophy size={20} />} text="Troféu do 1º ao 3º (Masc/Fem)" />
          <CheckItem icon={<Users size={20} />} text="Troféu para as 3 maiores equipes" />
          <CheckItem icon={<Droplet size={20} />} text="Hidratação no percurso" />
          <CheckItem icon={<Heart size={20} />} text="Frutas no pós-corrida" />
        </div>
      </section>

      {/* VIBE DO EVENTO */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase italic mb-6 text-yellow-400 tracking-tighter">✨ Por que esse dia vai ser inesquecível?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          
          <div className="bg-blue-900/50 shadow-sm p-6 rounded-2xl border border-blue-800/60 text-center">
            <Sun className="text-yellow-400 mx-auto mb-4" size={40}/>
            <h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Nascer do Sol</h4>
            <p className="text-sm text-blue-100 leading-relaxed">Começar o dia às 05h00 é viver a melhor energia da manhã e largar às 06h00 com o clima perfeito.</p>
          </div>

          <div className="bg-blue-900/50 shadow-sm p-6 rounded-2xl border border-blue-800/60 text-center">
            <Users className="text-emerald-400 mx-auto mb-4" size={40}/>
            <h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Comunidade Unida</h4>
            <p className="text-sm text-blue-100 leading-relaxed">O Terminal da UR-11 será o ponto de encontro de abraços, fotos, reencontros e muita celebração.</p>
          </div>

          <div className="bg-blue-900/50 shadow-sm p-6 rounded-2xl border border-blue-800/60 text-center">
            <Heart className="text-red-400 mx-auto mb-4" size={40}/>
            <h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Saúde e Felicidade</h4>
            <p className="text-sm text-blue-100 leading-relaxed">Mais do que quilômetros percorridos, vamos colecionar endorfina e a sensação de missão cumprida.</p>
          </div>

        </div>
      </section>

    </div>
  );
}