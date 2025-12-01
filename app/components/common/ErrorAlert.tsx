"use client";

import { AlertCircle, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!message || !isVisible) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="rounded-xl bg-red-50 border-2 border-red-200 p-4 shadow-sm"
    >
      <div className="flex items-start">
        <motion.div
          className="flex-shrink-0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
        >
          <AlertCircle className="h-5 w-5 text-red-500" />
        </motion.div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-red-800">{message}</p>
        </div>
        <motion.button
          onClick={() => setIsVisible(false)}
          className="ml-4 flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
