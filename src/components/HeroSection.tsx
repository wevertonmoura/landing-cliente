import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  vagasOcupadas: number;
  LIMITE_VAGAS: number;
  scrollToForm: (e: React.MouseEvent) => void;
  images: string[];
}

export default function HeroSection({ vagasOcupadas, LIMITE_VAGAS, scrollToForm, images }: HeroProps) {
  const imagemFixa = images[0]; 

  return (
    <section className="relative h-[85vh] flex flex-col items-center justify-between overflow-hidden bg-[#020412] pb-12">
      {/* Imagem de Fundo (Ocupa o espaço superior) */}
      <div className="absolute inset-0 z-0 h-[60vh]">
        <img 
          src={imagemFixa} 
          alt="Cenário da Trilha"
          className="w-full h-full object-cover" 
        />
        {/* Degradê suave que transita da imagem para o fundo azul */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020412]/40 to-[#020412]" />
      </div>

      {/* Espaçador para o texto ficar na parte inferior da tela */}
      <div className="z-10 flex-grow" />

      {/* Conteúdo (Título + Botão) - Agora eles ficam abaixo da imagem, sem cobri-la */}
      <div className="relative z-10 text-center px-4 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white drop-shadow-lg mb-8">
            O TRAILL <br />
            <span className="text-yellow-400">OS D'SEMPRE</span>
          </h1>
          
          <a 
            href="#inscricao" 
            onClick={scrollToForm} 
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-[#020412] font-black py-4 px-8 rounded-xl shadow-lg transition-all uppercase tracking-widest text-sm"
          >
            {vagasOcupadas >= LIMITE_VAGAS ? 'Lista de Espera' : 'Garantir Ingresso'} <ChevronRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}