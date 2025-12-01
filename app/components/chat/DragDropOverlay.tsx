"use client";

import { Upload } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";

interface DragDropOverlayProps {
  isDragging: boolean;
}

function DragDropOverlayComponent({ isDragging }: DragDropOverlayProps) {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm pointer-events-none z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/95 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border-4 border-dashed border-emerald-500"
          >
            <Upload className="w-16 h-16 text-emerald-600" />
            <p className="text-emerald-900 font-bold text-lg">Suelta los archivos aquí</p>
            <p className="text-gray-600 text-sm">Los archivos se subirán automáticamente</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const DragDropOverlay = memo(DragDropOverlayComponent);
