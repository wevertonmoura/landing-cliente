// src/components/Footer.tsx

import { Users, Instagram, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const linkGrupoGeral = "https://chat.whatsapp.com/H5DWJOz0wcC2PntYSq1t8y"; 
  const linkInstagram = "https://www.instagram.com/vem_para_trilha?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="; 

  return (
    <footer className="bg-zinc-950 pt-12 pb-6 border-t border-zinc-900 relative overflow-hidden mt-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent blur-sm"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-md mx-auto mb-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
          <h4 className="text-white font-black uppercase tracking-widest mb-4 flex items-center justify-center gap-2 text-sm">
            Faça parte da família <Users size={16} className="text-emerald-500"/>
          </h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={linkInstagram} target="_blank" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest">
              <Instagram size={16} /> Siga no Insta
            </motion.a>
            <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={linkGrupoGeral} target="_blank" className="flex-1 bg-emerald-600 text-white font-black py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest">
              Entrar no Grupo
            </motion.a>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 border-t border-zinc-900/80 pt-6">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">© 2026 Trilha 3 Reinos. Todos os direitos reservados.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="py-2 px-6 rounded-full bg-zinc-900/50 border border-zinc-800 text-emerald-500 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors">Voltar ao Topo <ArrowRight className="-rotate-90 w-3 h-3" /></button>
        </div>
      </div>
    </footer>
  );
}