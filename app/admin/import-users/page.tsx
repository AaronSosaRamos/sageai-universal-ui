"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload, FileSpreadsheet } from "lucide-react";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import { getUserTypeFromToken } from "@/lib/userType";

type ImportResult = {
  created?: { user_id: string; email: string }[];
  failed?: { row: number; email: string; error: string }[];
  total_created?: number;
  total_failed?: number;
  message?: string;
  detail?: string;
};

export default function AdminImportUsersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
      return;
    }
    if (getUserTypeFromToken(t) !== "admin") {
      window.location.href = "/";
      return;
    }
    setToken(t);
  }, []);

  const downloadTemplate = async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/users/import-template", {
        headers: { Token: token },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Error al descargar");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_usuarios.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !token) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/users/bulk-import", {
        method: "POST",
        headers: { Token: token },
        body: fd,
      });
      const data = (await res.json()) as ImportResult;
      if (!res.ok) {
        throw new Error(data.detail || "Error al importar");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col">
      <ChatHeader token={token} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Importar usuarios</h1>
        </div>

        <p className="text-gray-600 mb-6">
          Descarga la plantilla Excel, completa una fila por usuario (nombre, apellido, email,
          contraseña, tipo) y súbela aquí. Solo cuentas administradoras pueden usar esta
          herramienta.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
          >
            <Download className="w-5 h-5" />
            Descargar plantilla .xlsx
          </button>
          <label className="inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-dashed border-emerald-600 text-emerald-800 rounded-lg cursor-pointer hover:bg-emerald-50 font-medium">
            <Upload className="w-5 h-5" />
            {loading ? "Importando…" : "Subir Excel completado"}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              disabled={loading}
              onChange={onFile}
            />
          </label>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 text-sm">
            <p className="font-medium text-gray-900">
              Creados: {result.total_created ?? 0} · Fallidos: {result.total_failed ?? 0}
            </p>
            {result.message && <p className="text-amber-800">{result.message}</p>}
            {result.created && result.created.length > 0 && (
              <div>
                <p className="font-medium text-emerald-800 mb-2">Usuarios creados</p>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  {result.created.map((c) => (
                    <li key={c.user_id}>
                      {c.email} <span className="text-gray-400">({c.user_id})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.failed && result.failed.length > 0 && (
              <div>
                <p className="font-medium text-red-800 mb-2">Errores</p>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  {result.failed.map((f, i) => (
                    <li key={`${f.row}-${i}`}>
                      Fila {f.row} {f.email ? `· ${f.email}` : ""}: {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
      <ChatFooter />
    </div>
  );
}
