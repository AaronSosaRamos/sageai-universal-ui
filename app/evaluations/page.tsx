"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, ClipboardCheck, Loader2, BookOpen, User } from "lucide-react";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import { canManageEvaluations } from "@/lib/userType";

interface EvalItem {
  id: string;
  title: string;
  description: string;
  published: boolean;
  author_user_id: string;
  is_owner: boolean;
  question_count: number;
  created_at: string;
  published_at: string | null;
}

export default function EvaluationsListPage() {
  const [token, setToken] = useState<string | null>(null);
  const [published, setPublished] = useState<EvalItem[]>([]);
  const [mine, setMine] = useState<EvalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isEvalAdmin = token ? canManageEvaluations(token) : false;

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
      return;
    }
    setToken(t);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const rPub = await fetch("/api/evaluations?scope=published", { headers: { Token: token } });
      if (!rPub.ok) {
        const d = await rPub.json();
        throw new Error(d.detail || "Error al cargar");
      }
      const dPub = await rPub.json();
      setPublished(dPub.items || []);

      if (canManageEvaluations(token)) {
        const rMine = await fetch("/api/evaluations?scope=mine", { headers: { Token: token } });
        if (!rMine.ok) {
          const d = await rMine.json();
          throw new Error(d.detail || "Error al cargar");
        }
        const dMine = await rMine.json();
        setMine(dMine.items || []);
      } else {
        setMine([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <ChatHeader token={token} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardCheck className="w-8 h-8 text-emerald-400" />
              Evaluaciones
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              {isEvalAdmin
                ? "Crea evaluaciones desde documentos, publícalas y revisa resultados con retroalimentación automática."
                : "Responde las evaluaciones publicadas por el equipo. El acceso a crear evaluaciones es solo para administradores."}
            </p>
          </div>
          {isEvalAdmin && (
            <Link
              href="/evaluations/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva evaluación
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                Disponibles para responder
              </h2>
              {published.length === 0 ? (
                <p className="text-slate-500 text-sm">Aún no hay evaluaciones publicadas.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {published.map((ev) => (
                    <li key={ev.id}>
                      <Link
                        href={`/evaluations/${ev.id}`}
                        className="block rounded-xl border border-slate-700 bg-slate-900/80 p-4 hover:border-emerald-600/50 transition-colors"
                      >
                        <p className="font-medium text-white">{ev.title}</p>
                        {ev.description ? (
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                        ) : null}
                        <p className="text-xs text-slate-500 mt-2">
                          {ev.question_count} preguntas
                          {ev.is_owner ? " · Eres el autor" : ""}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {isEvalAdmin && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-400" />
                  Mis evaluaciones
                </h2>
                {mine.length === 0 ? (
                  <p className="text-slate-500 text-sm">No has creado evaluaciones todavía.</p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {mine.map((ev) => (
                      <li key={ev.id}>
                        <Link
                          href={`/evaluations/${ev.id}`}
                          className="block rounded-xl border border-slate-700 bg-slate-900/80 p-4 hover:border-emerald-600/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-white">{ev.title}</p>
                            <span
                              className={`text-xs shrink-0 px-2 py-0.5 rounded-full ${
                                ev.published
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-amber-500/20 text-amber-200"
                              }`}
                            >
                              {ev.published ? "Publicada" : "Borrador"}
                            </span>
                          </div>
                          {ev.description ? (
                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                          ) : null}
                          <p className="text-xs text-slate-500 mt-2">{ev.question_count} preguntas</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}
      </main>
      <ChatFooter />
    </div>
  );
}
