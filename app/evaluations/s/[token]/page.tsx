"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Send, ClipboardCheck, Timer } from "lucide-react";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import {
  SubmissionReview,
  type SubmissionReviewPayload,
} from "@/app/components/evaluations/SubmissionReview";

interface Question {
  id: string;
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
}

export default function SharedEvaluationPage() {
  const params = useParams();
  const tokenParam = params.token as string;
  const [token, setToken] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    title: string;
    description: string;
    duration_minutes: number;
    timed: boolean;
    evaluation_id: string;
  } | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [skewMs, setSkewMs] = useState(0);
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score_percent: number;
    feedback: string;
    review?: SubmissionReviewPayload;
  } | null>(null);
  const autoSent = useRef(false);
  const timeUpFired = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    if (!t) {
      sessionStorage.setItem("redirectAfterLogin", `/evaluations/s/${tokenParam}`);
      window.location.href = "/";
      return;
    }
    setToken(t);
  }, [tokenParam]);

  useEffect(() => {
    if (!tokenParam) return;
    let c = false;
    (async () => {
      setLoadingMeta(true);
      try {
        const res = await fetch(`/api/evaluations/share/${tokenParam}/meta`);
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.detail || "Enlace no válido");
        }
        const d = await res.json();
        if (!c) {
          setMeta({
            title: d.title,
            description: d.description || "",
            duration_minutes: d.duration_minutes || 0,
            timed: !!d.timed,
            evaluation_id: d.evaluation_id,
          });
        }
      } catch (e) {
        if (!c) setMetaError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!c) setLoadingMeta(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [tokenParam]);

  const begin = useCallback(async () => {
    if (!token || !tokenParam) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluations/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Token: token },
        body: JSON.stringify({ share_token: tokenParam }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "No se pudo iniciar");
      }
      const d = await res.json();
      setQuestions(d.questions || []);
      setSessionId(d.session_id || null);
      if (d.server_now) {
        const off = new Date(d.server_now).getTime() - Date.now();
        setSkewMs(off);
      }
      if (d.deadline_at) {
        setDeadlineMs(new Date(d.deadline_at).getTime());
      } else {
        setDeadlineMs(null);
      }
      autoSent.current = false;
      timeUpFired.current = false;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setStarting(false);
    }
  }, [token, tokenParam]);

  const submit = useCallback(
    async (isAuto = false) => {
      if (!token || !meta || !questions?.length) return;
      if (isAuto) {
        if (autoSent.current) return;
        autoSent.current = true;
      }
      setSubmitting(true);
      setError(null);
      try {
        const body: { answers: Record<string, number | string>; session_id?: string | null } = {
          answers: answersRef.current,
        };
        if (sessionId) body.session_id = sessionId;
        const res = await fetch(`/api/evaluations/${meta.evaluation_id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Token: token },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.detail || "Error al enviar");
        }
        const d = await res.json();
        setResult({
          score_percent: d.score_percent,
          feedback: d.feedback,
          review: d.review as SubmissionReviewPayload | undefined,
        });
        setQuestions([]);
      } catch (e) {
        if (isAuto) autoSent.current = false;
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setSubmitting(false);
      }
    },
    [token, meta, questions, sessionId]
  );

  useEffect(() => {
    if (deadlineMs === null || result) return;
    timeUpFired.current = false;
    const tick = () => {
      const now = Date.now() + skewMs;
      const rem = deadlineMs - now;
      setRemainingSec(Math.max(0, Math.ceil(rem / 1000)));
      if (rem <= 0 && !timeUpFired.current) {
        timeUpFired.current = true;
        void submit(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineMs, skewMs, result, submit]);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (metaError || !meta) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-red-300 text-center">{metaError || "No disponible"}</p>
        </main>
        <ChatFooter />
      </div>
    );
  }

  const fmt = (s: number | null) => {
    if (s === null || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white truncate">{meta.title}</span>
          </div>
          <Link href="/evaluations" className="text-sm text-emerald-400 hover:underline shrink-0">
            Evaluaciones
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {result ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-6">
            <p className="text-emerald-300 font-semibold text-lg">
              Resultado: {Number(result.score_percent).toFixed(1)}%
            </p>
            <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">{result.feedback}</p>
            {result.review?.questions?.length ? <SubmissionReview review={result.review} /> : null}
          </div>
        ) : !questions ? (
          <div className="space-y-6">
            {meta.description ? <p className="text-slate-400 text-sm">{meta.description}</p> : null}
            <p className="text-slate-500 text-sm">
              {meta.timed
                ? `Tiempo máximo: ${meta.duration_minutes} minutos. El cronómetro corre aunque cambies de pestaña.`
                : "Sin límite de tiempo."}
            </p>
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-red-200 text-sm">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={() => void begin()}
              disabled={starting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
            >
              {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Comenzar evaluación
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {deadlineMs !== null && remainingSec !== null && (
              <div
                className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                  remainingSec <= 60
                    ? "border-amber-500/50 bg-amber-950/40 text-amber-100"
                    : "border-slate-600 bg-slate-900/80 text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Timer className="w-5 h-5" />
                  Tiempo restante
                </span>
                <span className="text-xl font-mono font-bold">{fmt(remainingSec)}</span>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-slate-500 text-xs mb-2">
                  {idx + 1}. {q.type === "multiple_choice" ? "Opción múltiple" : "Respuesta abierta"}
                </p>
                <p className="text-white text-sm mb-3">{q.question}</p>
                {q.type === "multiple_choice" && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt, j) => (
                      <label key={j} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === j}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: j }))}
                          className="accent-emerald-500"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {q.type === "open" && (
                  <textarea
                    value={String(answers[q.id] ?? "")}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
                    placeholder="Escribe tu respuesta..."
                  />
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => void submit(false)}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Enviar respuestas
            </button>
          </div>
        )}
      </main>
      <ChatFooter />
    </div>
  );
}
