"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { LoginHeader } from "./auth/LoginHeader";
import { LoginForm } from "./auth/LoginForm";
import { RegisterUnlockHeader } from "./auth/RegisterUnlockHeader";
import { RegisterUnlockForm } from "./auth/RegisterUnlockForm";
import { RegisterHeader } from "./auth/RegisterHeader";
import { RegisterBulkExcelHint } from "./auth/RegisterBulkExcelHint";
import { RegisterForm } from "./auth/RegisterForm";

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

type AuthView = "login" | "registerUnlock" | "register";

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [view, setView] = useState<AuthView>("login");

  const clearRegisterGate = useCallback(async () => {
    try {
      await fetch("/api/register/unlock", { method: "DELETE", credentials: "include" });
    } catch {
      /* ignore */
    }
  }, []);

  const backToLogin = useCallback(async () => {
    await clearRegisterGate();
    setView("login");
  }, [clearRegisterGate]);

  const handleRegisterSuccess = useCallback(async () => {
    await clearRegisterGate();
    setView("login");
  }, [clearRegisterGate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

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
          className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-700/50"
        >
          {view === "login" && (
            <>
              <LoginHeader />
              <LoginForm onLoginSuccess={onLoginSuccess} />
              <motion.div
                className="mt-6 pt-2 border-t border-slate-700/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <p className="text-center text-xs text-slate-500 mb-3">
                  ¿Necesitas crear una cuenta?
                </p>
                <button
                  type="button"
                  onClick={() => setView("registerUnlock")}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-700/50 hover:border-slate-500 transition-colors"
                >
                  Registrar
                </button>
              </motion.div>
            </>
          )}

          {view === "registerUnlock" && (
            <>
              <RegisterUnlockHeader onBack={backToLogin} />
              <RegisterUnlockForm onUnlocked={() => setView("register")} />
            </>
          )}

          {view === "register" && (
            <>
              <RegisterHeader onBack={backToLogin} />
              <RegisterBulkExcelHint />
              <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
