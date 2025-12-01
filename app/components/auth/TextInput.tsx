"use client";

import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface TextInputProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  maxLength?: number;
  className?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TextInput({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  error,
  required = false,
  autoComplete,
  maxLength,
  className = "",
  onChange
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <label
        htmlFor={id}
        className={`block text-xs font-medium mb-1.5 transition-colors ${
          error ? "text-red-600" : isFocused ? "text-emerald-600" : "text-gray-700"
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <motion.input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          className={`block w-full px-3 py-2 text-sm text-gray-900 border-2 rounded-xl shadow-sm placeholder-gray-400 
            focus:outline-none transition-all duration-200 sm:text-sm
            ${
              error
                ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                : isFocused
                ? "border-emerald-400 bg-emerald-50/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                : "border-gray-200 bg-white hover:border-gray-300 focus:border-emerald-400"
            }
            ${className}`}
          placeholder={placeholder}
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
    </motion.div>
  );
}
