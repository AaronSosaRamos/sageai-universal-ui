"use client";

import { useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { TextInput } from "./TextInput";
import { PasswordInput } from "./PasswordInput";
import { ErrorAlert } from "../common/ErrorAlert";
import { AuthButton } from "../common/AuthButton";

interface LoginFormProps {
  onLoginSuccess: (token: string) => void;
  onRegister: () => void;
}

const loginSchema = z.object({
  email: z.string()
    .email("Email inválido")
    .min(1, "El email es requerido")
    .max(255, "El email es demasiado largo")
    .refine(value => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(value), {
      message: "Formato de email inválido"
    }),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(50, "La contraseña es demasiado larga")
    .refine(value => /[A-Z]/.test(value), {
      message: "Debe contener al menos una mayúscula"
    })
    .refine(value => /[a-z]/.test(value), {
      message: "Debe contener al menos una minúscula"
    })
    .refine(value => /[0-9]/.test(value), {
      message: "Debe contener al menos un número"
    })
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ onLoginSuccess, onRegister }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validateField = (field: keyof LoginFormData, value: string) => {
    try {
      loginSchema.shape[field].parse(value);
      setErrors(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues[0]?.message;
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError }));
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name as keyof LoginFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    try {
      loginSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof LoginFormData, string>> = {};
        error.issues.forEach((issue) => {
          const path = issue.path[0] as string;
          newErrors[path as keyof LoginFormData] = issue.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          secret_value: process.env.NEXT_PUBLIC_BACKEND_SECRET_VALUE
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Error al iniciar sesión");
      }
      
      sessionStorage.setItem('token', data.access_token);
      onLoginSuccess(data.access_token);
      
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      className="mt-8 space-y-6"
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <TextInput
            id="email"
            name="email"
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            error={errors.email}
            required
            autoComplete="email"
            onChange={handleChange}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <PasswordInput
            id="password"
            name="password"
            label="Contraseña"
            value={formData.password}
            error={errors.password}
            required
            autoComplete="current-password"
            onChange={handleChange}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ErrorAlert message={serverError} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <AuthButton
            type="submit"
            isLoading={isLoading}
            disabled={Object.entries(errors).some(([, value]) => value !== undefined)}
          >
            Iniciar Sesión
          </AuthButton>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <motion.button
            type="button"
            onClick={onRegister}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ¿No tienes cuenta?{" "}
            <span className="underline decoration-2 underline-offset-2">
              Regístrate aquí
            </span>
          </motion.button>
        </motion.div>
      </div>
    </motion.form>
  );
}
