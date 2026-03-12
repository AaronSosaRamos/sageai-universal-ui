"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import { SystemPromptPreview } from "@/app/components/assistants/SystemPromptPreview";
import Link from "next/link";

export default function EditAssistantPage() {
  const params = useParams();
  const id = params?.id as string;
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/assistants/${id}`, { headers: { Token: token } });
        if (!res.ok) throw new Error("No encontrado");
        const d = await res.json();
        setName(d.name);
        setDescription(d.description || "");
        setSystemPrompt(d.system_prompt || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, id]);

  const handleSave = async () => {
    if (!token || !name.trim() || !systemPrompt.trim()) {
      setError("Nombre y System Prompt son requeridos");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/assistants/${id}`, {
        method: "PUT",
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
      setSaving(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Editar Asistente</h1>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              <div>
                <label className="block font-medium text-gray-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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

              <button
                onClick={handleSave}
                disabled={!name.trim() || !systemPrompt.trim() || saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
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
