"use client";

import { FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";

export function RegisterBulkExcelHint() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="mb-6 p-4 rounded-xl border border-emerald-700/40 bg-emerald-950/30"
    >
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-2 text-left">
          <p className="text-sm font-semibold text-slate-100">¿Muchos usuarios a la vez? (Excel)</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esa pantalla ya existe: descargas la plantilla .xlsx, la completas y subes el archivo.
            Solo la pueden usar cuentas de administrador, con la sesión iniciada en el chat.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Después de entrar como administrador, en la barra superior elige{" "}
            <span className="text-slate-200 font-medium">Importar usuarios</span> (o abre la misma
            ruta desde el menú).
          </p>
        </div>
      </div>
    </motion.div>
  );
}
