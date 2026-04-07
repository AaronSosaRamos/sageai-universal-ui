import { createHmac, timingSafeEqual } from "crypto";

/** Validez del acceso al formulario de registro tras validar el secret. */
export const REGISTER_GATE_TTL_MS = 60 * 60 * 1000;

export const REGISTER_GATE_COOKIE = "register_gate";

export function createRegisterGateToken(serverSecret: string): string {
  const exp = Date.now() + REGISTER_GATE_TTL_MS;
  const sig = createHmac("sha256", serverSecret)
    .update(`register|${exp}`)
    .digest("hex");
  return Buffer.from(JSON.stringify({ exp, sig }), "utf8").toString("base64url");
}

export function verifyRegisterGateToken(serverSecret: string, token: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as { exp?: number; sig?: string };
    if (typeof parsed.exp !== "number" || typeof parsed.sig !== "string") return false;
    if (Date.now() > parsed.exp) return false;
    const expected = createHmac("sha256", serverSecret)
      .update(`register|${parsed.exp}`)
      .digest("hex");
    const a = Buffer.from(parsed.sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
