// src/components/HeroSection.tsx
import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
  vagasOcupadas: number;
  LIMITE_VAGAS: number;
  scrollToForm: (e: React.MouseEvent) => void;
  images: string[];
}

export default function HeroSection({ vagasOcupadas, LIMITE_VAGAS, scrollToForm, images }: HeroProps) {
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentImg((prev) => (prev === images.length - 1 ? 0 : prev + 1)), 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative h-[50vh] md:h-[60vh] flex items-end overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img key={currentImg} src={images[currentImg]} initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="w-full h-full object-cover" />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
      </div>
      <div className="container mx-auto px-6 pb-12 relative z-10">
        <span className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px]">Vem Para Trilha Apresenta</span>
        <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter mt-1 uppercase leading-none">Trilha <br/> <span className="text-emerald-500"> 3 Reinos</span></h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8">
          <a href="#inscricao" onClick={scrollToForm} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-3 px-8 rounded-xl shadow-lg transition-all uppercase tracking-widest text-[10px]">
            {vagasOcupadas >= LIMITE_VAGAS ? 'Lista de Espera' : 'Garantir Ingresso'} <ChevronRight size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}