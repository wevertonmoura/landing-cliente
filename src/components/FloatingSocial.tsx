import React from 'react';
import { Instagram, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FloatingSocial() {
  // Links atualizados do OS D'SEMPRE
  const linkGrupoGeral = "https://chat.whatsapp.com/DB4CizXQ1NyBsGQ6pnR8DL?s=cl&p=i&mlu=3"; 
  const linkInstagram = "https://www.instagram.com/osdsempre_oficial?igsh=MXFmdGlmdW1lYjBqMQ%3D%3D&utm_source=qr"; 

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Botão do Instagram */}
      <motion.a 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        href={linkInstagram} 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-gradient-to-tr from-purple-600 via-pink-500 to-yellow-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center border border-white/20"
        title="Siga nosso Instagram"
      >
        <Instagram size={24} />
      </motion.a>
      
      {/* Botão do WhatsApp */}
      <motion.a 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        href={linkGrupoGeral} 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-[#25D366] text-white p-3 rounded-full shadow-lg flex items-center justify-center border border-white/20"
        title="Entre no Grupo do WhatsApp"
      >
        <Users size={24} />
      </motion.a>
    </div>
  );
}