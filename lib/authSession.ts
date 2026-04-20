/**
 * Sesión en cliente: limpiar token y volver al login cuando la API rechaza la sesión (401).
 */

let redirectScheduled = false;

function requestInitHadToken(init?: RequestInit): boolean {
  if (!init?.headers) return false;
  const h = init.headers;
  if (h instanceof Headers) {
    return Boolean(h.get("Token")?.trim());
  }
  if (Array.isArray(h)) {
    return h.some(
      ([k, v]) => String(k).toLowerCase() === "token" && String(v ?? "").trim()
    );
  }
  const rec = h as Record<string, string>;
  return Boolean(rec.Token?.trim() || rec.token?.trim());
}

/** Para interceptores de Axios (headers en config). */
export function axiosConfigHadToken(config: { headers?: unknown } | null | undefined): boolean {
  if (!config?.headers) return false;
  const raw = config.headers;
  if (raw && typeof raw === "object" && "get" in raw && typeof (raw as { get: (k: string) => unknown }).get === "function") {
    const g = (raw as { get: (k: string) => unknown }).get;
    const t = g("Token") ?? g("token");
    if (typeof t === "string" && t.trim()) return true;
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const tok = o.Token ?? o.token;
    if (typeof tok === "string" && tok.trim()) return true;
    const common = o.common as Record<string, unknown> | undefined;
    const ct = common?.Token ?? common?.token;
    if (typeof ct === "string" && ct.trim()) return true;
  }
  return false;
}

export function clearClientAuthAndGoLogin(): void {
  if (typeof window === "undefined") return;
  if (redirectScheduled) return;
  redirectScheduled = true;
  try {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("sessionInfo");
    sessionStorage.removeItem("redirectAfterLogin");
  } catch {
    /* ignore */
  }
  window.location.assign("/");
}

function isSameOriginApiPath(urlStr: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const u = urlStr.startsWith("http")
      ? new URL(urlStr)
      : new URL(urlStr, window.location.origin);
    return u.origin === window.location.origin && u.pathname.startsWith("/api/");
  } catch {
    return urlStr.startsWith("/api/");
  }
}

/**
 * Intercepta fetch: 401 en rutas /api/ con Token enviado → limpiar sesión e ir al login.
 * Instalar una vez desde un Client Component montado en el layout (p. ej. AuthFetchProvider).
 */
export function installFetchAuthInterceptor(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { __sageAuthFetchInstalled?: boolean };
  if (w.__sageAuthFetchInstalled) return;
  w.__sageAuthFetchInstalled = true;

  const native = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await native(input, init);
    if (res.status !== 401) return res;
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (!isSameOriginApiPath(url)) return res;
    if (!requestInitHadToken(init)) return res;
    clearClientAuthAndGoLogin();
    return res;
  };
}
