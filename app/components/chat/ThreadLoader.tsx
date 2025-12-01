"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

interface ThreadLoaderProps {
  message?: string;
}

export function ThreadLoader({ message = "Cargando conversación..." }: ThreadLoaderProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4 p-8"
      >
        {/* Animated icon */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-lg font-semibold text-gray-800 mb-1">{message}</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <motion.div
              className="w-2 h-2 bg-emerald-600 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-emerald-600 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-emerald-600 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

