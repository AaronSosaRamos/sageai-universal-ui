"use client";

import { motion } from "framer-motion";
import { RegisterHeader } from "./auth/RegisterHeader";
import { RegisterBulkExcelHint } from "./auth/RegisterBulkExcelHint";
import { RegisterForm } from "./auth/RegisterForm";

interface RegisterScreenProps {
  onBack: () => void;
  onRegisterSuccess: () => void;
}

export function RegisterScreen({ onBack, onRegisterSuccess }: RegisterScreenProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Subtle animated glow orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-700 rounded-full filter blur-3xl opacity-10"
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-red-900 rounded-full filter blur-3xl opacity-10"
          animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 w-96 h-96 bg-amber-800 rounded-full filter blur-3xl opacity-10"
          animate={{ x: [0, 50, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar-dark"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-slate-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-slate-700/50"
        >
          <RegisterHeader onBack={onBack} />
          <RegisterBulkExcelHint />
          <RegisterForm onRegisterSuccess={onRegisterSuccess} />
        </motion.div>
      </motion.div>
    </div>
  );
}
