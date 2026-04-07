import { jwtDecode } from "jwt-decode";

export type AppUserType = "user" | "admin";

/**
 * Lee user_type del JWT (por defecto 'user' si falta, p. ej. tokens antiguos).
 */
export function getUserTypeFromToken(token: string | null): AppUserType {
  if (!token) return "user";
  try {
    const d = jwtDecode<{ user_type?: string }>(token);
    const t = (d.user_type || "user").toLowerCase();
    return t === "admin" ? "admin" : "user";
  } catch {
    return "user";
  }
}

export function canCreateAssistants(token: string | null): boolean {
  return getUserTypeFromToken(token) === "admin";
}
