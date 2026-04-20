"use client";

import { useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Clock,
  BookOpen,
  Brain,
  ChevronDown,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BarItem {
  key: string;
  name: string;
  index?: number;
  item_type?: string;
  name_long?: string;
  score_0_1?: number;
  score_percent?: number;
  avg_score_percent?: number;
  performance_band?: string;
  sample_n?: number;
}

interface RadarDim {
  subject: string;
  axis_key: string;
  value: number;
  fullMark: number;
}

interface HistogramBin {
  range_label?: string;
  range_key?: string;
  item_count?: number;
  attempt_count?: number;
}

interface PieSegment {
  name: string;
  value: number;
  segment_key?: string;
}

interface TimingData {
  is_timed?: boolean;
  limit_seconds?: number;
  duration_seconds?: number;
  time_used_ratio_0_1?: number;
  time_remaining_ratio_0_1?: number;
  seconds_remaining_at_submit?: number;
  time_limit_minutes?: number;
}

interface ComparisonRow {
  category: string;
  avg_percent?: number;
  avg_0_1?: number;
  question_count?: number;
}

interface StudentRow {
  attempt_id: string;
  user_id?: string;
  participant_name?: string;
  participant_email?: string;
  score_percent?: number | null;
  duration_seconds?: number | null;
  submitted_at?: string;
  relative_level?: string;
  mc_avg_percent?: number | null;
  open_avg_percent?: number | null;
  bar_by_item?: BarItem[];
  radar_dimensions?: RadarDim[];
  per_question_scores?: Record<string, number>;
  competency_dimensions?: Record<string, number>;
  patterns?: { strengths?: string[]; weaknesses?: string[]; misconceptions_flagged?: string[] };
  study_recommendations?: { priority_topics?: string[]; practice_suggestions?: string[]; estimated_effort_to_improve?: string };
  engagement_and_pacing?: { open_response_depth?: string; time_pressure_signal?: string; notes?: string };
  timing?: TimingData;
}

export interface AnalyticsData {
  evaluation_id: string;
  evaluation_title?: string;
  filtered_user_id?: string | null;
  attempt_count: number;
  timed_attempt_count?: number;
  summary: {
    avg_score_percent?: number | null;
    score_stddev?: number;
    avg_duration_seconds?: number | null;
    mc_avg_percent_across_attempts?: number | null;
    open_avg_percent_across_attempts?: number | null;
    max_score_percent?: number | null;
    min_score_percent?: number | null;
  };
  level_distribution?: Record<string, number>;
  effort_to_improve_distribution?: Record<string, number>;
  open_response_depth_distribution?: Record<string, number>;
  time_pressure_distribution?: Record<string, number>;
  bar_by_item_aggregated?: BarItem[];
  radar_aggregated?: RadarDim[];
  histogram_score_distribution?: HistogramBin[];
  score_series?: { label: string; score_percent: number; participant: string }[];
  per_student?: StudentRow[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  emerald: "#10b981",
  teal: "#14b8a6",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#38bdf8",
  indigo: "#6366f1",
  slate: "#64748b",
  lime: "#84cc16",
};

const BAND_COLORS: Record<string, string> = {
  high: C.emerald,
  mid: C.amber,
  low: C.rose,
};

const LEVEL_COLORS: Record<string, string> = {
  advanced: C.emerald,
  intermediate: C.teal,
  basic: C.amber,
  developing: C.rose,
  unknown: C.slate,
};

const TT = {
  contentStyle: { background: "#0f172a", border: "1px solid #334155", borderRadius: 10, fontSize: 11 },
  labelStyle: { color: "#94a3b8" },
  itemStyle: { color: "#e2e8f0" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Number(n).toFixed(digits)} %`;
}

function fmtSec(s: number | null | undefined): string {
  if (s == null) return "—";
  if (s < 60) return `${Math.round(s)} s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m} m ${sec} s`;
}

function fmtLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Recharts Tooltip formatter types exigen `unknown`; evita TS2322 con ValueType | undefined. */
function ttPct(value: unknown, seriesLabel: string): [string, string] {
  const n = typeof value === "number" ? value : Number(value);
  const text = Number.isFinite(n) ? `${n.toFixed(1)} %` : "—";
  return [text, seriesLabel];
}

function ttPctOne(value: unknown): [string] {
  const n = typeof value === "number" ? value : Number(value);
  const text = Number.isFinite(n) ? `${n.toFixed(1)} %` : "—";
  return [text];
}

function ttIntPct(value: unknown): [string] {
  const n = typeof value === "number" ? value : Number(value);
  const text = Number.isFinite(n) ? `${Math.round(n)} %` : "—";
  return [text];
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function Panel({ icon, title, subtitle, children, wide }: {
  icon: ReactNode; title: string; subtitle?: string; children: ReactNode; wide?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden ${wide ? "col-span-full" : ""}`}>
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/80 flex items-start gap-2.5">
        <span className="text-emerald-500 mt-0.5 shrink-0">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function Kpi({ label, value, sub, accent = "text-white" }: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function Empty({ msg = "Sin datos suficientes" }: { msg?: string }) {
  return <p className="text-xs text-slate-600 py-6 text-center">{msg}</p>;
}

// ─── Chart components ─────────────────────────────────────────────────────────

function BarByItemChart({ data }: { data: BarItem[] }) {
  const rows = data.map((d) => ({
    name: d.name,
    value: d.avg_score_percent ?? d.score_percent ?? 0,
    fill: BAND_COLORS[d.performance_band ?? ""] ?? C.slate,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${v}%`} />
        <Tooltip {...TT} formatter={(value) => ttPct(value, "Puntaje")} />
        <Bar dataKey="value" isAnimationActive={false} radius={[4, 4, 0, 0]}>
          {rows.map((r, i) => <Cell key={i} fill={r.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RadarDimsChart({ data }: { data: RadarDim[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#1e293b" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94a3b8" }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#475569" }} />
        <Radar name="Puntaje" dataKey="value" stroke={C.emerald} fill={C.emerald} fillOpacity={0.25} />
        <Tooltip {...TT} formatter={(value) => ttPctOne(value)} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function HistogramChart({ data }: { data: HistogramBin[] }) {
  const rows = data.map((d) => ({
    name: d.range_label ?? d.range_key ?? "",
    value: d.item_count ?? d.attempt_count ?? 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
        <Tooltip {...TT} />
        <Bar dataKey="value" name="Cantidad" fill={C.violet} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PieDistributionChart({ data, colors }: { data: PieSegment[]; colors?: Record<string, string> }) {
  const palette = [C.emerald, C.violet, C.amber, C.rose, C.sky, C.teal];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={35}
          isAnimationActive={false}
          label={({ name, value }) => `${name}: ${value}`}
          labelLine={false}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={colors?.[d.segment_key ?? d.name] ?? palette[i % palette.length]}
            />
          ))}
        </Pie>
        <Tooltip {...TT} />
        <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ScoreSeriesChart({ data }: { data: { label: string; score_percent: number; participant: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#64748b" }} tickFormatter={(v) => `${v}%`} />
        <Tooltip {...TT} formatter={(value) => ttPct(value, "Puntaje")} />
        <Line type="monotone" dataKey="score_percent" stroke={C.emerald} strokeWidth={2} dot={{ fill: C.emerald, r: 4 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ComparisonChart({ data }: { data: ComparisonRow[] }) {
  const rows = data.map((d) => ({
    name: d.category,
    value: d.avg_percent ?? (d.avg_0_1 != null ? d.avg_0_1 * 100 : 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 20, left: 80, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} width={78} />
        <Tooltip {...TT} formatter={(value) => ttPct(value, "Promedio")} />
        <Bar dataKey="value" name="Promedio" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {rows.map((_, i) => <Cell key={i} fill={i === 0 ? C.teal : C.violet} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TimingGaugeRow({ timing }: { timing: TimingData }) {
  const usedPct = Math.round((timing.time_used_ratio_0_1 ?? 0) * 100);
  const remPct = 100 - usedPct;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Tiempo usado</span>
        <span className="font-mono text-white">{fmtSec(timing.duration_seconds)} / {timing.time_limit_minutes} min</span>
      </div>
      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${Math.min(usedPct, 100)}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
          <p className="text-slate-500">Usado</p>
          <p className="text-emerald-300 font-mono font-semibold">{usedPct} %</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
          <p className="text-slate-500">Restante al enviar</p>
          <p className="text-sky-300 font-mono font-semibold">{remPct} %</p>
        </div>
      </div>
    </div>
  );
}

function CompetencyBars({ dims }: { dims: Record<string, number> }) {
  const LABELS: Record<string, string> = {
    conceptual_understanding_0_1: "Comprensión conceptual",
    reasoning_argumentation_0_1: "Razonamiento/Argumentación",
    application_transfer_0_1: "Aplicación/Transferencia",
    communication_clarity_0_1: "Claridad comunicativa",
  };
  const rows = Object.entries(dims).map(([k, v]) => ({
    name: LABELS[k] ?? fmtLabel(k.replace(/_0_1$/, "")),
    value: Math.round((v ?? 0) * 100),
  }));
  if (!rows.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 44)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 20, left: 150, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} width={148} />
        <Tooltip {...TT} formatter={(value) => ttIntPct(value)} />
        <Bar dataKey="value" name="Nivel" radius={[0, 4, 4, 0]} isAnimationActive={false} fill={C.indigo}>
          {rows.map((r, i) => (
            <Cell key={i} fill={r.value >= 80 ? C.emerald : r.value >= 50 ? C.amber : C.rose} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Una fila por usuario (intento más reciente). */
function dedupeStudentsLatest(rows: StudentRow[]): StudentRow[] {
  const byUser = new Map<string, StudentRow>();
  const sorted = [...rows].sort(
    (a, b) =>
      new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()
  );
  for (const s of sorted) {
    const key = s.user_id || s.attempt_id;
    if (!byUser.has(key)) byUser.set(key, s);
  }
  return Array.from(byUser.values()).sort((a, b) =>
    (a.participant_name || a.participant_email || "").localeCompare(
      b.participant_name || b.participant_email || ""
    )
  );
}

function latestRowForUser(rows: StudentRow[], userId: string | null): StudentRow | null {
  if (!userId) return null;
  const forUser = rows.filter((s) => s.user_id === userId);
  if (!forUser.length) return null;
  return forUser.reduce((best, s) =>
    new Date(s.submitted_at || 0) > new Date(best.submitted_at || 0) ? s : best
  );
}

// ─── Student picker ───────────────────────────────────────────────────────────

function StudentPicker({
  students,
  selected,
  onSelect,
}: {
  students: StudentRow[];
  selected: string | null;
  onSelect: (uid: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = selected ? latestRowForUser(students, selected) : null;
  const label = current
    ? current.participant_name || current.participant_email || `ID ${(current.user_id ?? "").slice(0, 8)}…`
    : "Todos los estudiantes";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
      >
        <Users className="w-4 h-4 text-emerald-500" />
        <span className="max-w-[200px] truncate">{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 text-slate-300 border-b border-slate-800"
            onClick={() => { onSelect(null); setOpen(false); }}
          >
            Todos los estudiantes
          </button>
          <div className="max-h-60 overflow-y-auto">
            {students.map((s) => {
              const name = s.participant_name || s.participant_email || `ID ${(s.user_id ?? "").slice(0, 8)}…`;
              return (
                <button
                  key={s.user_id || s.attempt_id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 flex justify-between items-center"
                  onClick={() => { onSelect(s.user_id ?? null); setOpen(false); }}
                >
                  <span className="text-slate-200 truncate">{name}</span>
                  <span className="text-emerald-400 text-xs font-mono ml-2 shrink-0">
                    {s.score_percent != null ? `${Number(s.score_percent).toFixed(1)}%` : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Aggregated view ──────────────────────────────────────────────────────────

function AggregatedView({ data }: { data: AnalyticsData }) {
  const { summary, level_distribution, bar_by_item_aggregated, radar_aggregated,
    histogram_score_distribution, score_series, effort_to_improve_distribution,
    open_response_depth_distribution, time_pressure_distribution } = data;

  const levelPie: PieSegment[] = Object.entries(level_distribution ?? {}).map(([k, v]) => ({
    name: fmtLabel(k),
    value: v,
    segment_key: k,
  }));

  const effortPie: PieSegment[] = Object.entries(effort_to_improve_distribution ?? {}).map(([k, v]) => ({
    name: fmtLabel(k),
    value: v,
    segment_key: k,
  }));

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Intentos" value={String(data.attempt_count)} sub="Total registrados" accent="text-white" />
        <Kpi label="Puntaje promedio" value={fmtPct(summary.avg_score_percent)} sub={`σ = ${summary.score_stddev?.toFixed(2) ?? "—"}`} accent="text-emerald-300" />
        <Kpi label="Máximo" value={fmtPct(summary.max_score_percent)} accent="text-emerald-400" />
        <Kpi label="Mínimo" value={fmtPct(summary.min_score_percent)} accent="text-rose-400" />
        <Kpi label="Opción múltiple (avg)" value={fmtPct(summary.mc_avg_percent_across_attempts)} accent="text-sky-300" />
        <Kpi label="Abiertas (avg)" value={fmtPct(summary.open_avg_percent_across_attempts)} accent="text-violet-300" />
      </div>

      {/* Bar by item + Radar */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel icon={<BarChart3 className="w-4 h-4" />}
          title="Puntaje promedio por ítem"
          subtitle="Desempeño colectivo pregunta por pregunta. Verde = alto, ámbar = medio, rojo = bajo.">
          {bar_by_item_aggregated?.length
            ? <BarByItemChart data={bar_by_item_aggregated} />
            : <Empty />}
        </Panel>
        <Panel icon={<Target className="w-4 h-4" />}
          title="Radar de dimensiones (promedio grupo)"
          subtitle="Promedio de cada eje del radar sobre todos los intentos.">
          {radar_aggregated?.length
            ? <RadarDimsChart data={radar_aggregated} />
            : <Empty />}
        </Panel>
      </div>

      {/* Histogram + Score series */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel icon={<BarChart3 className="w-4 h-4" />}
          title="Distribución de puntajes (histograma)"
          subtitle="Cantidad de intentos por rango de puntuación (0–100 %).">
          {histogram_score_distribution?.length
            ? <HistogramChart data={histogram_score_distribution} />
            : <Empty />}
        </Panel>
        <Panel icon={<TrendingUp className="w-4 h-4" />}
          title="Serie de puntajes por intento"
          subtitle="Evolución del puntaje en orden de envío.">
          {score_series?.length
            ? <ScoreSeriesChart data={score_series} />
            : <Empty />}
        </Panel>
      </div>

      {/* Level distribution + Effort */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel icon={<Brain className="w-4 h-4" />}
          title="Distribución de nivel relativo"
          subtitle="Cuántos estudiantes fueron clasificados en cada nivel de dominio.">
          {levelPie.length
            ? <PieDistributionChart data={levelPie} colors={LEVEL_COLORS} />
            : <Empty />}
        </Panel>
        <Panel icon={<BookOpen className="w-4 h-4" />}
          title="Esfuerzo estimado para mejorar"
          subtitle="Distribución del esfuerzo recomendado por el LLM sobre todos los intentos.">
          {effortPie.length
            ? <PieDistributionChart data={effortPie} />
            : <Empty />}
        </Panel>
      </div>

      {/* Pacing signals */}
      {(open_response_depth_distribution && Object.keys(open_response_depth_distribution).length > 0) ||
       (time_pressure_distribution && Object.keys(time_pressure_distribution).length > 0)
        ? (
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel icon={<Clock className="w-4 h-4" />}
              title="Profundidad de respuesta abierta"
              subtitle="Calificación LLM de qué tan elaboradas fueron las respuestas abiertas.">
              <PieDistributionChart
                data={Object.entries(open_response_depth_distribution ?? {}).map(([k, v]) => ({
                  name: fmtLabel(k), value: v, segment_key: k,
                }))}
              />
            </Panel>
            <Panel icon={<Clock className="w-4 h-4" />}
              title="Señal de presión de tiempo"
              subtitle="¿El ritmo del estudiante sugirió presión, relajación o urgencia?">
              <PieDistributionChart
                data={Object.entries(time_pressure_distribution ?? {}).map(([k, v]) => ({
                  name: fmtLabel(k), value: v, segment_key: k,
                }))}
              />
            </Panel>
          </div>
        ) : null}
    </div>
  );
}

// ─── Single-student view ──────────────────────────────────────────────────────

function StudentView({ student }: { student: StudentRow }) {
  const competency = student.competency_dimensions ?? {};
  const patterns = student.patterns ?? {};
  const recs = student.study_recommendations ?? {};
  const pacing = student.engagement_and_pacing ?? {};
  const timing = student.timing;

  const comparisonData: ComparisonRow[] = [];
  if (student.mc_avg_percent != null) {
    comparisonData.push({ category: "Opción múltiple", avg_percent: student.mc_avg_percent });
  }
  if (student.open_avg_percent != null) {
    comparisonData.push({ category: "Respuesta abierta", avg_percent: student.open_avg_percent });
  }

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi
          label="Puntaje global"
          value={fmtPct(student.score_percent)}
          accent={
            (student.score_percent ?? 0) >= 80
              ? "text-emerald-300"
              : (student.score_percent ?? 0) >= 50
              ? "text-amber-300"
              : "text-rose-400"
          }
        />
        <Kpi label="Nivel relativo" value={fmtLabel(student.relative_level ?? "unknown")} />
        <Kpi label="Duración" value={fmtSec(student.duration_seconds)} />
        <Kpi label="OM / Abiertas" value={`${fmtPct(student.mc_avg_percent, 0)} / ${fmtPct(student.open_avg_percent, 0)}`} sub="Promedio por tipo" />
      </div>

      {/* Bar by item + Radar */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel icon={<BarChart3 className="w-4 h-4" />}
          title="Puntaje por ítem"
          subtitle="Desempeño individual en cada pregunta de la evaluación.">
          {student.bar_by_item?.length
            ? <BarByItemChart data={student.bar_by_item} />
            : <Empty />}
        </Panel>
        <Panel icon={<Target className="w-4 h-4" />}
          title="Radar de dimensiones"
          subtitle="Perfil multidimensional: global, opción múltiple, abiertas, consistencia.">
          {student.radar_dimensions?.length
            ? <RadarDimsChart data={student.radar_dimensions} />
            : <Empty />}
        </Panel>
      </div>

      {/* Comparison + Competency */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel icon={<BarChart3 className="w-4 h-4" />}
          title="Comparación OM vs. Abiertas"
          subtitle="Promedio por tipo de ítem.">
          {comparisonData.length
            ? <ComparisonChart data={comparisonData} />
            : <Empty />}
        </Panel>
        <Panel icon={<Brain className="w-4 h-4" />}
          title="Dimensiones de competencia"
          subtitle="Comprensión, razonamiento, aplicación y comunicación (0–100 %).">
          {Object.keys(competency).length
            ? <CompetencyBars dims={competency} />
            : <Empty />}
        </Panel>
      </div>

      {/* Timing gauge */}
      {timing?.is_timed && (
        <Panel icon={<Clock className="w-4 h-4" />}
          title="Uso del tiempo"
          subtitle="Proporción de tiempo usada vs. restante al momento del envío.">
          <TimingGaugeRow timing={timing} />
        </Panel>
      )}

      {/* Patterns + Recs */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel icon={<TrendingUp className="w-4 h-4" />} title="Patrones detectados">
          <div className="space-y-3 text-sm">
            {patterns.strengths?.length ? (
              <div>
                <p className="text-emerald-400 text-xs font-semibold mb-1">Fortalezas</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {patterns.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            ) : null}
            {patterns.weaknesses?.length ? (
              <div>
                <p className="text-rose-400 text-xs font-semibold mb-1">Debilidades</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {patterns.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            ) : null}
            {patterns.misconceptions_flagged?.length ? (
              <div>
                <p className="text-amber-400 text-xs font-semibold mb-1">Concepciones erróneas</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {patterns.misconceptions_flagged.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            ) : null}
            {!patterns.strengths?.length && !patterns.weaknesses?.length && <Empty />}
          </div>
        </Panel>

        <Panel icon={<BookOpen className="w-4 h-4" />} title="Recomendaciones de estudio">
          <div className="space-y-3 text-sm">
            {recs.priority_topics?.length ? (
              <div>
                <p className="text-sky-400 text-xs font-semibold mb-1">Temas prioritarios</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {recs.priority_topics.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            ) : null}
            {recs.practice_suggestions?.length ? (
              <div>
                <p className="text-violet-400 text-xs font-semibold mb-1">Sugerencias</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {recs.practice_suggestions.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            ) : null}
            {recs.estimated_effort_to_improve && (
              <p className="text-xs text-slate-500 pt-1">
                Esfuerzo estimado: <span className="text-slate-300">{fmtLabel(recs.estimated_effort_to_improve)}</span>
              </p>
            )}
            {pacing.notes && (
              <p className="text-xs text-slate-400 italic border-t border-slate-800 pt-2">{pacing.notes}</p>
            )}
            {!recs.priority_topics?.length && !recs.practice_suggestions?.length && <Empty />}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  evaluationId: string;
  token: string;
  /** Datos ya cargados (p. ej. GET /admin/evaluations/analytics); evita otra petición por evaluación. */
  prefetchedAnalytics?: AnalyticsData | null;
}

export function EvaluationAnalytics({ evaluationId, token, prefetchedAnalytics }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(prefetchedAnalytics ?? null);
  const [loading, setLoading] = useState(prefetchedAnalytics == null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/evaluations/${evaluationId}/analytics`, {
        headers: { Token: token },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Error al cargar analytics");
      setData(json as AnalyticsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [evaluationId, token]);

  useEffect(() => {
    setSelectedUserId(null);
  }, [evaluationId]);

  useEffect(() => {
    if (prefetchedAnalytics != null) {
      setData(prefetchedAnalytics);
      setLoading(false);
      setError(null);
      return;
    }
    void load();
  }, [evaluationId, token, prefetchedAnalytics, load]);

  const handleSelectUser = useCallback((uid: string | null) => {
    setSelectedUserId(uid);
  }, []);

  const allRows = useMemo(() => data?.per_student ?? [], [data]);
  const studentsPickList = useMemo(() => dedupeStudentsLatest(allRows), [allRows]);
  const selectedStudent =
    data && selectedUserId ? latestRowForUser(allRows, selectedUserId) : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20 gap-3 text-slate-500">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <span className="text-sm">Calculando métricas…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-red-200 text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            {selectedStudent
              ? `Análisis individual: ${selectedStudent.participant_name || selectedStudent.participant_email || `ID ${(selectedStudent.user_id ?? "").slice(0, 8)}…`}`
              : "Análisis agregado del grupo"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {data.attempt_count} intento{data.attempt_count !== 1 ? "s" : ""} registrado{data.attempt_count !== 1 ? "s" : ""}
            {data.timed_attempt_count ? ` · ${data.timed_attempt_count} con temporizador` : ""}
          </p>
        </div>
        {studentsPickList.length > 0 && (
          <StudentPicker
            students={studentsPickList}
            selected={selectedUserId}
            onSelect={handleSelectUser}
          />
        )}
      </div>

      {/* Body: vista agregada o fila del estudiante (sin segunda petición HTTP) */}
      {selectedUserId ? (
        selectedStudent ? (
          <StudentView student={selectedStudent} />
        ) : (
          <Empty msg="No hay datos para este estudiante." />
        )
      ) : (
        <AggregatedView data={data} />
      )}
    </div>
  );
}
