"use client";

import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

export type ReviewQuestionRow =
  | {
      id: string;
      type: "multiple_choice";
      question: string;
      score: number;
      score_percent: number;
      options: string[];
      correct_index: number | null;
      correct_option_text: string | null;
      user_answer_index: number | null;
      user_answer_text: string | null;
      is_correct: boolean;
    }
  | {
      id: string;
      type: "open";
      question: string;
      score: number;
      score_percent: number;
      user_answer_text: string;
      rubric: string;
    };

export interface SubmissionReviewPayload {
  questions: ReviewQuestionRow[];
  question_count: number;
}

function scoreBadgeClass(score: number) {
  if (score >= 0.85) return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  if (score >= 0.5) return "bg-amber-500/15 text-amber-100 border-amber-500/35";
  return "bg-red-500/15 text-red-100 border-red-500/35";
}

export function SubmissionReview({ review }: { review: SubmissionReviewPayload }) {
  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-white font-medium text-sm flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-emerald-400" />
        Detalle por pregunta (respuestas correctas y tuyas)
      </h3>
      <ul className="space-y-4">
        {review.questions.map((q, idx) => (
          <li
            key={q.id}
            className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-slate-400 text-xs">
                {idx + 1}.{" "}
                {q.type === "multiple_choice" ? "Opción múltiple" : "Respuesta abierta"}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border tabular-nums ${scoreBadgeClass(q.score)}`}
              >
                {q.score_percent.toFixed(1)}% ítem
              </span>
            </div>
            <p className="text-white">{q.question}</p>

            {q.type === "multiple_choice" ? (
              <div className="space-y-2 text-slate-300">
                <ul className="list-none space-y-1 pl-0">
                  {q.options.map((opt, j) => {
                    const isCorrect = q.correct_index === j;
                    const isUser = q.user_answer_index === j;
                    return (
                      <li
                        key={j}
                        className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${
                          isCorrect
                            ? "bg-emerald-950/50 border border-emerald-600/40"
                            : isUser && !isCorrect
                              ? "bg-red-950/40 border border-red-500/30"
                              : "border border-transparent"
                        }`}
                      >
                        <span className="shrink-0 w-5 text-center text-slate-500">{j + 1}.</span>
                        <span className="flex-1">{opt}</span>
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-label="Correcta" />
                        ) : null}
                        {isUser && !isCorrect ? (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" aria-label="Tu respuesta" />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-slate-500">
                  Correcta:{" "}
                  <span className="text-emerald-300">
                    {q.correct_option_text ?? (q.correct_index != null ? `opción ${q.correct_index + 1}` : "—")}
                  </span>
                  {" · "}
                  Tuya:{" "}
                  <span className={q.is_correct ? "text-emerald-300" : "text-amber-200"}>
                    {q.user_answer_text ?? "—"}
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tu respuesta</p>
                  <p className="text-slate-200 whitespace-pre-wrap rounded-lg bg-slate-950/60 border border-slate-700/80 px-3 py-2">
                    {q.user_answer_text || "(vacío)"}
                  </p>
                </div>
                {q.rubric ? (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Rúbrica de referencia</p>
                    <p className="text-slate-400 text-xs whitespace-pre-wrap border border-slate-700/60 rounded-lg px-3 py-2">
                      {q.rubric}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
