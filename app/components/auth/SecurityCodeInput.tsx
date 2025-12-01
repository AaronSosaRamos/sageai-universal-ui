"use client";

import { AlertCircle, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface SecurityCodeInputProps {
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SecurityCodeInput({ value, error, onChange }: SecurityCodeInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <label
        htmlFor="security_code"
        className={`block text-xs font-medium mb-1.5 transition-colors ${
          error ? "text-red-600" : isFocused ? "text-teal-600" : "text-gray-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3" />
          Código de Seguridad
          <span className="text-red-500 ml-1">*</span>
        </div>
      </label>
      <div className="relative">
        <motion.input
          id="security_code"
          name="security_code"
          type="text"
          required
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`block w-full px-3 py-2 border-2 rounded-xl shadow-sm placeholder-gray-400 
            focus:outline-none transition-all duration-200 text-sm text-gray-900 uppercase font-mono tracking-widest text-center
            ${
              error
                ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                : isFocused
                ? "border-teal-400 bg-teal-50/50 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                : "border-gray-200 bg-white hover:border-gray-300 focus:border-teal-400"
            }`}
          placeholder="ABC123"
          maxLength={6}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
            >
              <AlertCircle className="h-5 w-5 text-red-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mt-2 text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <motion.p
        className="mt-2 text-xs text-gray-500 flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Shield className="h-3 w-3" />
        Contacta al administrador para obtener un código de seguridad válido.
      </motion.p>
    </motion.div>
  );
}
