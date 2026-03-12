"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Upload, Sparkles, Save, X } from "lucide-react";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import { SystemPromptPreview } from "@/app/components/assistants/SystemPromptPreview";
import Link from "next/link";

const ACCEPTED_TYPES = ".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp";

export default function NewAssistantPage() {
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<{ session_uuid: string; inner_uuid: string } | null>(null);
  const [files, setFiles] = useState<{ file: File; path?: string }[]>([]);
  const [userHint, setUserHint] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initSession = useCallback(async () => {
    const t = sessionStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
      return null;
    }
    setToken(t);
    const res = await fetch("/api/session", { method: "POST", headers: { Token: t } });
    if (!res.ok) throw new Error("Error al crear sesión");
    const data = await res.json();
    setSession({ session_uuid: data.session_uuid, inner_uuid: data.inner_uuid });
    return data;
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length === 0) return;
      let s = session;
      if (!s && token) {
        try {
          s = await initSession();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error");
          return;
        }
      }
      if (!s?.session_uuid || !s?.inner_uuid || !token) return;

      setLoading(true);
      setError(null);
      const newFiles: { file: File; path?: string }[] = [];
      for (const file of selected) {
        const formData = new FormData();
        formData.append("files", file);
        const res = await fetch(`/api/files/${s.session_uuid}/${s.inner_uuid}`, {
          method: "POST",
          headers: { Token: token },
          body: formData,
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || d.detail || "Error al subir");
          setLoading(false);
          return;
        }
        const d = await res.json();
        const path = d.uploaded?.[0];
        if (path) {
          const match = path.match(/\/files\/(.+)/);
          newFiles.push({ file, path: match ? match[1] : path });
        }
      }
      setFiles((prev) => [...prev, ...newFiles]);
      setLoading(false);
      e.target.value = "";
    },
    [session, token, initSession]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!token || files.length === 0) {
      setError("Sube al menos un archivo (PDF, DOCX o imagen)");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const fileRefs = files.map((f) => f.path).filter(Boolean) as string[];
      const res = await fetch("/api/assistants/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Token: token },
        body: JSON.stringify({ file_refs: fileRefs, user_hint: userHint }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Error al generar");
      }
      const d = await res.json();
      setSystemPrompt(d.system_prompt || "");
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!token || !name.trim() || !systemPrompt.trim()) {
      setError("Nombre y System Prompt son requeridos");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assistants", {
        method: "POST",
        headers: { "Content-Type": "application/json", Token: token },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), system_prompt: systemPrompt }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Error al guardar");
      }
      window.location.href = "/assistants";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, [initSession]);

  if (!token) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <ChatHeader token={token} />
      </div>

      <main className="flex-1 min-h-0 px-4 py-8 pb-20 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/assistants" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Asistente</h1>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {step === "upload" && (
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-gray-900 mb-2">1. Sube archivos</h2>
                <p className="text-sm text-gray-500 mb-3">
                  PDF, DOCX o imágenes. El contenido se usará para generar el System Prompt.
                </p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {loading ? "Subiendo..." : "Haz clic o arrastra archivos aquí"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_TYPES}
                    multiple
                    disabled={loading}
                    onChange={handleFileSelect}
                  />
                </label>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm truncate flex-1">{f.file.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-2">Pista opcional</label>
                <input
                  type="text"
                  value={userHint}
                  onChange={(e) => setUserHint(e.target.value)}
                  placeholder="Ej: Quiero un asistente experto en ventas"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={files.length === 0 || generating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generar System Prompt
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setStep("preview");
                    if (!systemPrompt) setSystemPrompt("");
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Escribir manualmente
                </button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              <h2 className="font-semibold text-gray-900">2. Revisa y guarda</h2>

              <div>
                <label className="block font-medium text-gray-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Asistente de Ventas"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción del asistente"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">System Prompt *</label>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Editar (Markdown)</p>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={14}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                      placeholder="Define el comportamiento y conocimiento del asistente..."
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Vista previa</p>
                    <div className="w-full min-h-[320px] px-4 py-3 border border-gray-200 rounded-lg bg-slate-50 overflow-y-auto">
                      <SystemPromptPreview content={systemPrompt} className="text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("upload")}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || !systemPrompt.trim() || loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Asistente
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="flex-shrink-0">
        <ChatFooter />
      </div>
    </div>
  );
}
