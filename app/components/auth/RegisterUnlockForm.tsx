"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TextInput } from "./TextInput";
import { ErrorAlert } from "../common/ErrorAlert";
import { AuthButton } from "../common/AuthButton";

interface RegisterUnlockFormProps {
  onUnlocked: () => void;
}

export function RegisterUnlockForm({ onUnlocked }: RegisterUnlockFormProps) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = secret.trim();
    if (!trimmed) {
      setError("Ingresa el código de acceso");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/register/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ secret_value: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.detail === "string" ? data.detail : "Código de acceso inválido"
        );
      }
      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo validar el acceso");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      className="mt-6 space-y-5"
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <TextInput
        id="register_secret"
        name="register_secret"
        label="Código que te dieron para registrarte"
        type="password"
        placeholder=""
        value={secret}
        autoComplete="off"
        required
        onChange={(e) => setSecret(e.target.value)}
      />
      <p className="text-xs text-slate-500 leading-relaxed -mt-2">
        Lo entrega quien administra el sistema. No es la contraseña con la que inicias sesión después.
      </p>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ErrorAlert message={error} />
          </motion.div>
        )}
      </AnimatePresence>

      <AuthButton type="submit" isLoading={isLoading} disabled={!secret.trim()}>
        Continuar al registro
      </AuthButton>
    </motion.form>
  );
}
