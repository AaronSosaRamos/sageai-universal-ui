"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function LoginHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.div
        className="flex justify-center mb-6"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Image
          src="/logo.png"
          alt="Logo"
          width={200}
          height={60}
          className="h-12 w-auto drop-shadow-lg"
          priority
        />
      </motion.div>
      <motion.h2
        className="mt-2 text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Iniciar Sesión
      </motion.h2>
      <motion.p
        className="mt-2 text-center text-sm text-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Bienvenido de vuelta
      </motion.p>
    </motion.div>
  );
}
