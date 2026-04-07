"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface RegisterHeaderProps {
  onBack: () => void;
}

export function RegisterHeader({ onBack }: RegisterHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.button
        onClick={onBack}
        className="mb-3 flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors group"
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ x: [0, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:text-emerald-600 transition-colors" />
        </motion.div>
        Volver al login
      </motion.button>
      
      <motion.div
        className="flex justify-center mb-4"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Image
          src="/logo.png"
          alt="Logo UNCP"
          width={80}
          height={80}
          className="h-20 w-20 drop-shadow-2xl rounded-full"
          priority
        />
      </motion.div>
      
      <motion.h2
        className="text-center text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Registro de Usuario
      </motion.h2>
      
      <motion.p
        className="mt-1 text-center text-xs text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Una cuenta con el formulario de abajo. Para cargar muchos usuarios con Excel, lee el
        bloque siguiente (solo administradores).
      </motion.p>
    </motion.div>
  );
}
