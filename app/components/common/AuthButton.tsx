"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface AuthButtonProps {
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function AuthButton({ 
  type = "submit", 
  isLoading = false, 
  disabled = false, 
  onClick,
  children 
}: AuthButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={isLoading || disabled}
      onClick={onClick}
      className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
      style={{ 
        background: "linear-gradient(135deg, #005E44 0%, #059669 100%)",
      }}
      whileHover={!disabled && !isLoading ? { 
        scale: 1.02,
        boxShadow: "0 10px 25px -5px rgba(5, 150, 105, 0.4)"
      } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
      />
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        animate={isLoading ? {} : { x: "200%" }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "linear",
        }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Procesando...</span>
          </>
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
}
