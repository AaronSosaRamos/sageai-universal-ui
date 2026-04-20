"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Save,
  Loader2,
  Send,
  FileText,
} from "lucide-react";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import { DragDropOverlay } from "@/app/components/chat/DragDropOverlay";
import { useDragAndDrop } from "@/app/hooks/useDragAndDrop";
import { canManageEvaluations } from "@/lib/userType";

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp";
const MAX_FILE_BYTES = 2 * 1024 * 1024;

interface Question {
  id: string;
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
  correct_index?: number;
  rubric?: string;
}

export default function NewEvaluationPage() {
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<{ session_uuid: string; inner_uuid: string } | null>(null);
  const [files, setFiles] = useState<{ file: File; path?: string }[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [requirements, setRequirements] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
      return;
    }
    if (!canManageEvaluations(t)) {
      window.location.href = "/evaluations";
      return;
    }
    setToken(t);
  }, []);

  const initSession = useCallback(async () => {
    const t = sessionStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
      return null;
    }
    const res = await fetch("/api/session", { method: "POST", headers: { Token: t } });
    if (!res.ok) throw new Error("Error al crear sesión");
    const data = await res.json();
    const s = { session_uuid: data.session_uuid, inner_uuid: data.inner_uuid };
    setSession(s);
    return s;
  }, []);

  const uploadFiles = useCallback(
    async (fileList: File[]) => {
      if (!token) return;
      let s = session;
      if (!s) {
        try {
          s = await initSession();
        } catch {
          setError("No se pudo iniciar sesión para subir archivos");
          return;
        }
      }
      if (!s?.session_uuid || !s?.inner_uuid) return;

      setLoading(true);
      setError(null);
      const newFiles: { file: File; path?: string }[] = [];
      for (const file of fileList) {
        if (file.size > MAX_FILE_BYTES) {
          setError(`El archivo ${file.name} supera 2 MB`);
          setLoading(false);
          return;
        }
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
    },
    [session, token, initSession]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      e.target.value = "";
      if (selected.length === 0) return;
      await uploadFiles(selected);
    },
    [uploadFiles]
  );

  const dragDrop = useDragAndDrop(uploadFiles);
  const dragHandlers = useMemo(
    () => ({
      onDragEnter: dragDrop.handleDragEnter,
      onDragLeave: dragDrop.handleDragLeave,
      onDragOver: dragDrop.handleDragOver,
      onDrop: dragDrop.handleDrop,
    }),
    [dragDrop]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!token || files.length === 0) {
      setError("Sube al menos un archivo (PDF, Word o imagen)");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const fileRefs = files.map((f) => f.path).filter(Boolean) as string[];
      const res = await fetch("/api/evaluations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Token: token },
        body: JSON.stringify({
          file_refs: fileRefs,
          requirements,
          additional_context: additionalContext,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Error al generar");
      }
      const d = await res.json();
      setTitle(d.title || "");
      setDescription(d.description || "");
      setQuestions(Array.isArray(d.questions) ? d.questions : []);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setGenerating(false);
    }
  };

  const saveEvaluation = async (published: boolean) => {
    if (!token || !title.trim() || questions.length === 0) {
      setError("Completa el título y las preguntas");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const hintParts = [additionalContext.trim(), requirements.trim()].filter(Boolean);
      const requirementsHint =
        hintParts.length === 2
          ? `Contexto adicional:\n${additionalContext.trim()}\n\n---\n\nRequisitos:\n${requirements.trim()}`
          : hintParts[0] || "";
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Token: token },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          requirements_hint: requirementsHint,
          questions,
          published,
          duration_minutes: durationMinutes > 0 ? durationMinutes : 0,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Error al guardar");
      }
      const d = await res.json();
      window.location.href = `/evaluations/${d.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative" {...dragHandlers}>
      <DragDropOverlay isDragging={dragDrop.isDragging} />
      <ChatHeader token={token} />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/evaluations"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a evaluaciones
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">Nueva evaluación</h1>
        <p className="text-slate-400 text-sm mb-8">
          Sube material de referencia, añade el contexto que quieras (curso, perfil del grupo, prioridades) y los
          requisitos del examen; luego genera las preguntas con IA.
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-6">
            <div
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                dragDrop.isDragging ? "border-emerald-400 bg-emerald-950/30" : "border-slate-600 bg-slate-900/50"
              }`}
            >
              <Upload className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-white font-medium">Arrastra PDF, DOC/DOCX o imágenes aquí</p>
              <p className="text-slate-500 text-sm mt-1">Máximo 2 MB por archivo</p>
              <input
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                className="hidden"
                id="eval-files"
                onChange={handleFileInput}
              />
              <label
                htmlFor="eval-files"
                className="inline-block mt-4 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 cursor-pointer text-sm"
              >
                O seleccionar archivos
              </label>
            </div>

            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((f, i) => (
                  <li
                    key={`${f.file.name}-${i}`}
                    className="flex items-center justify-between rounded-lg bg-slate-800/80 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f.file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-slate-500 hover:text-red-400 text-xs"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contexto adicional (opcional)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Información que no está en los archivos: asignatura, unidad, nivel del curso, perfil de los
                estudiantes, competencias a evaluar, idioma, o cualquier prioridad antes de generar preguntas.
              </p>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Ej.: Grado 3 de secundaria, unidad &quot;Ecosistemas&quot;, priorizar aplicación de conceptos más que memorización. Los alumnos tienen dificultad con lectura larga; enunciados breves."
                rows={6}
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none min-h-[140px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Requisitos y formato de la evaluación (opcional)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Cómo debe ser el cuestionario: dificultad, proporción de tipos de pregunta, temas del material a
                priorizar, duración implícita, etc.
              </p>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Ej.: Nivel intermedio; unas 8–10 preguntas; 60% opción múltiple y 40% respuesta corta; enfocarse en el capítulo 2 del PDF."
                rows={4}
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || loading || files.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              Generar evaluación con IA
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Tiempo máximo para completar (minutos)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                0 = sin límite. Con tiempo, los participantes deben usar el enlace compartido; el reloj sigue en
                segundo plano.
              </p>
              <input
                type="number"
                min={0}
                max={600}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-32 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-white mb-6"
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Preguntas generadas</h2>
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm"
                >
                  <p className="text-slate-500 text-xs mb-1">
                    {idx + 1}. {q.type === "multiple_choice" ? "Opción múltiple" : "Respuesta abierta"}
                  </p>
                  <p className="text-white">{q.question}</p>
                  {q.type === "multiple_choice" && q.options && (
                    <ul className="mt-2 space-y-1 text-slate-300">
                      {q.options.map((opt, j) => (
                        <li key={j}>
                          {j === q.correct_index ? "✓ " : "○ "}
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => saveEvaluation(false)}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar borrador
              </button>
              <button
                type="button"
                onClick={() => saveEvaluation(true)}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Publicar
              </button>
            </div>
          </div>
        )}
      </main>
      <ChatFooter />
    </div>
  );
}
