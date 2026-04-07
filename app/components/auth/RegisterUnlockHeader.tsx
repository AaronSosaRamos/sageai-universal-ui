"use client";

import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface RegisterUnlockHeaderProps {
  onBack: () => void;
}

export function RegisterUnlockHeader({ onBack }: RegisterUnlockHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:text-emerald-500 transition-colors" />
        Volver al inicio de sesión
      </button>
      <h2 className="text-center text-xl font-bold text-white tracking-tight">
        Registro de usuarios
      </h2>
      <p className="mt-2 text-center text-sm text-slate-400">
        Escribe el código que te dieron para poder completar el registro.
      </p>
    </motion.div>
  );
}
