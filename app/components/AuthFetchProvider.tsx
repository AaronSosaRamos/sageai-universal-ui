"use client";

import { useEffect } from "react";
import { installFetchAuthInterceptor } from "@/lib/authSession";

/**
 * Registra el interceptor de fetch para 401 → limpiar token y redirigir al login.
 * Debe montarse en el layout raíz (cliente).
 */
export function AuthFetchProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    installFetchAuthInterceptor();
  }, []);
  return <>{children}</>;
}
