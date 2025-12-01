"use client";

import { useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { TextInput } from "./TextInput";
import { PasswordInput } from "./PasswordInput";
import { SecurityCodeInput } from "./SecurityCodeInput";
import { ErrorAlert } from "../common/ErrorAlert";
import { AuthButton } from "../common/AuthButton";

interface RegisterFormProps {
  onRegisterSuccess: () => void;
}

const registerSchema = z.object({
  nombre: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre es demasiado largo")
    .refine(value => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value), {
      message: "El nombre solo puede contener letras y espacios"
    }),
  apellido: z.string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido es demasiado largo")
    .refine(value => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value), {
      message: "El apellido solo puede contener letras y espacios"
    }),
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
    }),
  security_code: z.string()
    .min(6, "El código debe tener 6 caracteres")
    .max(6, "El código debe tener 6 caracteres")
    .refine(value => /^[A-Z0-9]{6}$/.test(value), {
      message: "El código debe contener solo letras mayúsculas y números"
    })
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    security_code: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validateField = (field: keyof RegisterFormData, value: string) => {
    try {
      registerSchema.shape[field].parse(value);
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
    validateField(name as keyof RegisterFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    try {
      registerSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};
        error.issues.forEach((issue) => {
          const path = issue.path[0] as string;
          newErrors[path as keyof RegisterFormData] = issue.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Error al registrar usuario");
      }

      onRegisterSuccess();
      
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Error al registrar usuario");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      className="mt-4 space-y-4"
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="space-y-3">
        {/* Nombre */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <TextInput
            id="nombre"
            name="nombre"
            label="Nombre"
            placeholder="Juan"
            value={formData.nombre}
            error={errors.nombre}
            required
            onChange={handleChange}
          />
        </motion.div>

        {/* Apellido */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <TextInput
            id="apellido"
            name="apellido"
            label="Apellido"
            placeholder="Pérez"
            value={formData.apellido}
            error={errors.apellido}
            required
            onChange={handleChange}
          />
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
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

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <PasswordInput
            id="password"
            name="password"
            label="Contraseña"
            value={formData.password}
            error={errors.password}
            required
            autoComplete="new-password"
            onChange={handleChange}
          />
        </motion.div>

        {/* Security Code */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <SecurityCodeInput
            value={formData.security_code}
            error={errors.security_code}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
        className="pt-2"
      >
        <AuthButton
          type="submit"
          isLoading={isLoading}
          disabled={Object.entries(errors).some(([, value]) => value !== undefined)}
        >
          Registrarse
        </AuthButton>
      </motion.div>
    </motion.form>
  );
}
