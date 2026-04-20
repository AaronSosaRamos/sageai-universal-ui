"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ClipboardCheck,
  Users,
  Send,
  Eye,
  Trash2,
  Link2,
  Timer,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import { canManageEvaluations } from "@/lib/userType";
import {
  SubmissionReview,
  type SubmissionReviewPayload,
} from "@/app/components/evaluations/SubmissionReview";
import { EvaluationAnalytics } from "@/app/components/evaluations/EvaluationAnalytics";

interface Question {
  id: string;
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
  correct_index?: number;
  rubric?: string;
}

interface EvalDetail {
  id: string;
  title: string;
  description: string;
  requirements_hint?: string;
  published: boolean;
  is_owner: boolean;
  questions: Question[];
  duration_minutes: number;
  timed: boolean;
  share_token: string | null;
}

interface AttemptMetrics {
  per_question_scores?: Record<string, number>;
  question_count?: number;
  timed?: boolean;
  multiple_choice_count?: number;
  open_count?: number;
}

interface Attempt {
  id: string;
  user_id?: string;
  score_percent: number | null;
  feedback: string;
  answers: Record<string, unknown>;
  created_at: string;
  submitted_at?: string;
  started_at?: string | null;
  duration_seconds?: number | null;
  participant_email?: string | null;
  participant_name?: string | null;
  metrics?: AttemptMetrics;
}

export default function EvaluationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [token, setToken] = useState<string | null>(null);
  const [detail, setDetail] = useState<EvalDetail | null>(null);
  const [takeQuestions, setTakeQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [tab, setTab] = useState<"info" | "take" | "results" | "analytics">("info");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score_percent: number;
    feedback: string;
    review?: SubmissionReviewPayload;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [skewMs, setSkewMs] = useState(0);
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [takeLoading, setTakeLoading] = useState(false);
  const timeUpFired = useRef(false);
  const answersRef = useRef<Record<string, number | string>>({});
  const [durationEdit, setDurationEdit] = useState<number>(0);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    if (!t) {
      window.location.href = "/";
      return;
    }
    setToken(t);
  }, []);

  const loadDetail = useCallback(
    async (previewStudent: boolean) => {
      if (!token) return null;
      const qs = previewStudent ? "?preview_student=1" : "";
      const res = await fetch(`/api/evaluations/${id}${qs}`, { headers: { Token: token } });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "No se pudo cargar");
      }
      return res.json() as Promise<EvalDetail>;
    },
    [token, id]
  );

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    setTakeQuestions(null);
    setSessionId(null);
    setDeadlineMs(null);
    setRemainingSec(null);
    setAnswers({});
    setResult(null);
    timeUpFired.current = false;
  }, [id]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await loadDetail(false);
        if (cancelled || !d) return;
        setDetail(d);
        setDurationEdit(d.duration_minutes || 0);
        if ((!d.is_owner || !canManageEvaluations(token)) && d.published) {
          setTab("take");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, id, loadDetail]);

  /** Vista alumno solo con GET (sin session/start): no consume temporizador del servidor ni reanuda sesión. */
  const loadStudentPreviewQuestions = useCallback(async () => {
    if (!token || !id) return;
    setTakeLoading(true);
    setError(null);
    setTakeQuestions(null);
    setSessionId(null);
    setDeadlineMs(null);
    setRemainingSec(null);
    setSkewMs(0);
    timeUpFired.current = false;
    try {
      const d = await loadDetail(true);
      if (!d) return;
      setTakeQuestions(d.questions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setTakeLoading(false);
    }
  }, [token, id, loadDetail]);

  const startTakeSession = useCallback(async () => {
    if (!token || !id) return;
    setTakeLoading(true);
    setError(null);
    setTakeQuestions(null);
    setSessionId(null);
    setDeadlineMs(null);
    setRemainingSec(null);
    timeUpFired.current = false;
    try {
      const res = await fetch("/api/evaluations/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", Token: token },
        body: JSON.stringify({ evaluation_id: id }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "No se pudo iniciar la sesión");
      }
      const d = await res.json();
      setTakeQuestions(d.questions || []);
      setSessionId(d.session_id || null);
      if (d.server_now) {
        setSkewMs(new Date(d.server_now).getTime() - Date.now());
      } else {
        setSkewMs(0);
      }
      if (d.deadline_at) {
        setDeadlineMs(new Date(d.deadline_at).getTime());
      } else {
        setDeadlineMs(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setTakeLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    if (!token || !detail?.published || tab !== "take") return;
    const adminStudentPreview = detail.is_owner && canManageEvaluations(token);
    if (adminStudentPreview) {
      void loadStudentPreviewQuestions();
      return;
    }
    void startTakeSession();
  }, [
    token,
    detail?.published,
    detail?.is_owner,
    tab,
    id,
    startTakeSession,
    loadStudentPreviewQuestions,
  ]);

  useEffect(() => {
    if (!token || tab !== "results") return;
    (async () => {
      try {
        const res = await fetch(`/api/evaluations/${id}/attempts`, { headers: { Token: token } });
        if (!res.ok) return;
        const data = await res.json();
        setAttempts(data.items || []);
      } catch {
        /* ignore */
      }
    })();
  }, [token, id, tab]);

  const submitInFlight = useRef(false);

  const handleSubmit = async () => {
    if (!token || !takeQuestions?.length) return;
    if (detail?.timed && !sessionId) {
      setError(
        "Con tiempo límite debes usar el enlace compartido o abrir la evaluación como participante para iniciar el cronómetro del servidor."
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: { answers: Record<string, number | string>; session_id?: string | null } = {
        answers: answersRef.current,
      };
      if (sessionId) payload.session_id = sessionId;
      const res = await fetch(`/api/evaluations/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Token: token },
        body: JSON.stringify(payload),
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
      setTab("results");
      const ar = await fetch(`/api/evaluations/${id}/attempts`, { headers: { Token: token } });
      if (ar.ok) {
        const aj = await ar.json();
        setAttempts(aj.items || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (deadlineMs === null || tab !== "take" || takeLoading) return;
    const tick = () => {
      const now = Date.now() + skewMs;
      const rem = deadlineMs - now;
      setRemainingSec(Math.max(0, Math.ceil(rem / 1000)));
      if (rem <= 0 && !timeUpFired.current && token && takeQuestions?.length && !takeLoading) {
        timeUpFired.current = true;
        void (async () => {
          if (submitInFlight.current) return;
          submitInFlight.current = true;
          setSubmitting(true);
          setError(null);
          try {
            const payload: { answers: Record<string, number | string>; session_id?: string | null } = {
              answers: answersRef.current,
            };
            if (sessionId) payload.session_id = sessionId;
            const res = await fetch(`/api/evaluations/${id}/submit`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Token: token },
              body: JSON.stringify(payload),
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
            setTab("results");
            const ar = await fetch(`/api/evaluations/${id}/attempts`, { headers: { Token: token } });
            if (ar.ok) {
              const aj = await ar.json();
              setAttempts(aj.items || []);
            }
          } catch (e) {
            setError(e instanceof Error ? e.message : "Error");
            timeUpFired.current = false;
          } finally {
            submitInFlight.current = false;
            setSubmitting(false);
          }
        })();
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [deadlineMs, skewMs, tab, token, id, sessionId, takeQuestions, takeLoading]);

  const publish = async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`/api/evaluations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Token: token },
        body: JSON.stringify({ published: true }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Error");
      }
      const d = await res.json();
      setDetail(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const remove = async () => {
    if (!token || !confirm("¿Eliminar esta evaluación?")) return;
    try {
      const res = await fetch(`/api/evaluations/${id}`, {
        method: "DELETE",
        headers: { Token: token },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Error");
      }
      window.location.href = "/evaluations";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const saveDuration = async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`/api/evaluations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Token: token },
        body: JSON.stringify({ duration_minutes: durationEdit > 0 ? durationEdit : 0 }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Error");
      }
      const d = await res.json();
      setDetail(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const copyShareLink = async () => {
    if (!detail?.share_token || typeof window === "undefined") return;
    const url = `${window.location.origin}/evaluations/s/${detail.share_token}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const rotateShareLink = async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`/api/evaluations/${id}/share/rotate`, {
        method: "POST",
        headers: { Token: token },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Error");
      }
      const d = await res.json();
      setDetail((prev) => (prev ? { ...prev, share_token: d.share_token } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const fmtTime = (s: number | null) => {
    if (s === null || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const fmtDurationSec = (sec: number | null | undefined) => {
    if (sec == null || sec < 0) return "—";
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <ChatHeader token={token} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
        <ChatFooter />
      </div>
    );
  }

  const showTake =
    detail.published &&
    !takeLoading &&
    takeQuestions !== null &&
    takeQuestions.length > 0;
  const isOwner = detail.is_owner;
  const isEvalAdmin = token ? canManageEvaluations(token) : false;
  const canManage = isOwner && isEvalAdmin;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <ChatHeader token={token} />
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 py-8 ${tab === "analytics" ? "max-w-6xl" : "max-w-3xl"}`}>
        <Link
          href="/evaluations"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardCheck className="w-7 h-7 text-emerald-400 shrink-0" />
              {detail.title}
            </h1>
            {detail.description ? (
              <p className="text-slate-400 mt-2 text-sm">{detail.description}</p>
            ) : null}
            <p className="text-xs text-slate-500 mt-2">
              {detail.published ? (
                <span className="text-emerald-400">Publicada</span>
              ) : (
                <span className="text-amber-400">Borrador</span>
              )}
            </p>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-2">
              {!detail.published && (
                <button
                  type="button"
                  onClick={publish}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
                >
                  Publicar
                </button>
              )}
              <button
                type="button"
                onClick={remove}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-950/50 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {canManage && (
          <div className="flex gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setTab("info")}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                tab === "info" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Contenido
            </button>
            <button
              type="button"
              onClick={() => setTab("take")}
              disabled={!detail.published}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                tab === "take"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white disabled:opacity-40"
              }`}
            >
              <Eye className="w-4 h-4" />
              Responder (vista alumno)
            </button>
            <button
              type="button"
              onClick={() => setTab("results")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                tab === "results"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Resultados
            </button>
            <button
              type="button"
              onClick={() => setTab("analytics")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                tab === "analytics"
                  ? "bg-emerald-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        )}

        {!canManage && detail.published && (
          <div className="flex gap-2 border-b border-slate-800 pb-3 mb-6">
            <button
              type="button"
              onClick={() => setTab("take")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                tab === "take" ? "bg-slate-700 text-white" : "text-slate-400"
              }`}
            >
              Cuestionario
            </button>
            <button
              type="button"
              onClick={() => setTab("results")}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                tab === "results" ? "bg-slate-700 text-white" : "text-slate-400"
              }`}
            >
              Mis resultados
            </button>
          </div>
        )}

        {tab === "info" && (
          <div className="space-y-4">
            {canManage && detail.published && detail.share_token && (
              <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-4 text-sm space-y-3">
                <p className="text-emerald-300 font-medium flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Enlace para participantes
                </p>
                <p className="text-slate-400 text-xs">
                  Comparte este enlace para que inicien sesión y completen la evaluación. El tiempo corre según el
                  servidor aunque cierren la pestaña.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <code className="flex-1 text-xs bg-slate-900 px-3 py-2 rounded-lg text-slate-300 break-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/evaluations/s/${detail.share_token}`
                      : ""}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyShareLink()}
                    className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                  >
                    {linkCopied ? "Copiado" : "Copiar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void rotateShareLink()}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm"
                    title="Invalidar el enlace anterior"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Nuevo enlace
                  </button>
                </div>
                <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-700/60">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tiempo máximo (minutos)</label>
                    <input
                      type="number"
                      min={0}
                      value={durationEdit}
                      onChange={(e) => setDurationEdit(parseInt(e.target.value, 10) || 0)}
                      className="w-28 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-white text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveDuration()}
                    className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm"
                  >
                    Guardar tiempo
                  </button>
                  <span className="text-xs text-slate-500">0 = sin límite</span>
                </div>
              </div>
            )}
            {canManage && detail.requirements_hint ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Requisitos (autor)</p>
                <p className="text-slate-300">{detail.requirements_hint}</p>
              </div>
            ) : null}
            {detail.questions.map((q, idx) => (
              <div key={q.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm">
                <p className="text-slate-500 text-xs mb-1">
                  {idx + 1}. {q.type === "multiple_choice" ? "Opción múltiple" : "Abierta"}
                </p>
                <p className="text-white">{q.question}</p>
                {canManage && q.type === "multiple_choice" && q.options && (
                  <ul className="mt-2 text-slate-400">
                    {q.options.map((o, j) => (
                      <li key={j}>
                        {j === q.correct_index ? "✓ " : "○ "}
                        {o}
                      </li>
                    ))}
                  </ul>
                )}
                {canManage && q.type === "open" && q.rubric && (
                  <p className="mt-2 text-xs text-slate-500">Rúbrica: {q.rubric}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "take" && canManage && detail.published && detail.timed && (
          <div className="mb-4 rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-amber-100/95 text-sm">
            Vista previa (autor): aquí no corre el temporizador del servidor. Para probar el tiempo real y enviar con
            límite, usa el enlace compartido o entra como participante desde la lista «Disponibles para responder».
          </div>
        )}

        {tab === "take" && detail.published && takeLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-slate-500 text-sm">Preparando evaluación…</p>
          </div>
        )}

        {tab === "take" && showTake && takeQuestions && (
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
                <span className="text-xl font-mono font-bold">{fmtTime(remainingSec)}</span>
              </div>
            )}
            {takeQuestions.map((q, idx) => (
              <div key={q.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-slate-500 text-xs mb-2">
                  {idx + 1}. {q.type === "multiple_choice" ? "Opción múltiple" : "Respuesta abierta"}
                </p>
                <p className="text-white text-sm mb-3">{q.question}</p>
                {q.type === "multiple_choice" && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt, j) => (
                      <label
                        key={j}
                        className="flex items-center gap-2 cursor-pointer text-sm text-slate-300"
                      >
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
              onClick={handleSubmit}
              disabled={submitting || (!!detail.timed && !sessionId)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Enviar respuestas
            </button>
            {detail.timed && !sessionId ? (
              <p className="text-xs text-amber-200/90">
                El envío con tiempo límite requiere una sesión iniciada (enlace público o modo participante).
              </p>
            ) : null}
          </div>
        )}

        {tab === "take" && canManage && !detail.published && (
          <p className="text-slate-500 text-sm">Publica la evaluación para poder responderla en modo alumno.</p>
        )}

        {tab === "analytics" && canManage && token && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Panel de rendimiento</h2>
            </div>
            <p className="text-xs text-slate-500 -mt-1 mb-4">
              Métricas detalladas de todos los intentos. Usa el selector para ver el perfil individual de un estudiante.
            </p>
            <EvaluationAnalytics evaluationId={id} token={token} />
          </div>
        )}

        {tab === "results" && (
          <div className="space-y-6">
            {result && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4">
                <p className="text-emerald-300 font-semibold">
                  Última nota: {result.score_percent != null ? `${Number(result.score_percent).toFixed(1)}%` : "—"}
                </p>
                <p className="text-slate-300 text-sm mt-2 whitespace-pre-wrap">{result.feedback}</p>
                {result.review?.questions?.length ? (
                  <SubmissionReview review={result.review} />
                ) : null}
              </div>
            )}
            <h3 className="text-white font-medium flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              {canManage ? "Intentos registrados" : "Tus intentos"}
            </h3>
            {attempts.length === 0 ? (
              <p className="text-slate-500 text-sm">Aún no hay intentos.</p>
            ) : (
              <ul className="space-y-4">
                {attempts.map((a) => {
                  const who =
                    a.participant_name?.trim() ||
                    a.participant_email?.trim() ||
                    (canManage && a.user_id ? `ID ${a.user_id.slice(0, 8)}…` : "Participante");
                  const when = a.submitted_at || a.created_at;
                  const perQ = a.metrics?.per_question_scores;
                  return (
                    <li
                      key={a.id}
                      className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <p className="text-white font-medium">{who}</p>
                          {canManage && (a.participant_email || a.user_id) ? (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {a.participant_email || ""}
                              {a.participant_email && a.user_id ? " · " : ""}
                              {canManage && a.user_id ? `user_id: ${a.user_id}` : ""}
                            </p>
                          ) : null}
                          <p className="text-xs text-slate-500 mt-1">
                            Enviado: {new Date(when).toLocaleString()}
                            {a.started_at ? ` · Inicio: ${new Date(a.started_at).toLocaleString()}` : ""}
                            {` · Duración: ${fmtDurationSec(a.duration_seconds)}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                            {a.score_percent != null ? `${Number(a.score_percent).toFixed(1)}%` : "—"}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Puntaje global</p>
                        </div>
                      </div>
                      {perQ && Object.keys(perQ).length > 0 && (
                        <details className="group border-t border-slate-700/80 pt-2">
                          <summary className="cursor-pointer text-xs text-emerald-500/90 hover:text-emerald-400">
                            Métricas por pregunta (0–1)
                          </summary>
                          <ul className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {Object.entries(perQ).map(([qid, sc]) => (
                              <li
                                key={qid}
                                className="flex justify-between gap-2 bg-slate-950/50 rounded px-2 py-1 text-slate-300"
                              >
                                <span className="truncate text-slate-500">{qid}</span>
                                <span className="text-emerald-300 font-mono">{Number(sc).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                          {a.metrics?.question_count != null ? (
                            <p className="text-[11px] text-slate-500 mt-2">
                              Preguntas: {a.metrics.question_count}
                              {a.metrics.multiple_choice_count != null
                                ? ` · OM: ${a.metrics.multiple_choice_count}`
                                : ""}
                              {a.metrics.open_count != null ? ` · Abiertas: ${a.metrics.open_count}` : ""}
                              {a.metrics.timed != null ? ` · Temporizada: ${a.metrics.timed ? "sí" : "no"}` : ""}
                            </p>
                          ) : null}
                        </details>
                      )}
                      <p className="text-slate-300 whitespace-pre-wrap border-t border-slate-700/60 pt-2">
                        {a.feedback}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </main>
      <ChatFooter />
    </div>
  );
}
