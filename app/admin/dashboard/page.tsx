"use client";

import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft, BarChart3, BookOpen, Bot, Clock, Cpu, FileSpreadsheet,
  GraduationCap, KeyRound, Layers, Scale, ShieldCheck, Sparkles,
  TrendingUp, Users, Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Cell,
  PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import { getUserTypeFromToken } from "@/lib/userType";

// ─── Types ────────────────────────────────────────────────────────────────────

type DailyPoint = { date: string; events: number };
type TopName    = { event_name: string; count: number };
type RecentEv   = {
  id: string; occurred_at: string; event_category: string;
  event_name: string; user_id?: string | null;
  status_code?: number | null; duration_ms?: number | null; success?: boolean | null;
};
type LatencyBlock = { n: number; p50_ms: number | null; p95_ms: number | null; mean_ms: number | null };
type DailySeries  = { date: string; supervisor: number; assistant: number; uploads: number; exports: number; sessions: number; threads: number; total: number };
type TokenDay     = { date: string; total: number; input: number; output: number };
type HeatRow      = { weekday: number; label: string; hours: number[] };

interface DashboardData {
  period_days: number; period_start: string; period_end: string;
  academic?: { document_title_suggestion?: string; measurement_timezone?: string; definitions?: Record<string, string> };
  totals: { interaction_events: number; users?: number | null; assistants?: number | null };
  adoption_reach?: {
    unique_active_users_in_sample?: number; user_id_sample_rows?: number;
    mean_events_per_distinct_user_in_sample?: number | null;
    login_success_rate?: number | null; login_attempts_observed?: number;
    new_user_accounts_in_period?: number | null;
    ratio_sample_active_users_to_registered_total?: number | null;
  };
  pedagogical_mediation?: Record<string, number | null | undefined>;
  administration_metrics?: Record<string, number>;
  events_by_category: Record<string, number>;
  daily_activity: DailyPoint[];
  auth: { login_success: number; login_failure: number };
  product_highlights: { supervisor_invocations: number; assistant_chat_invocations: number; file_uploads: number; file_downloads?: number; exports: number };
  temporal_patterns?: { hourly_utc: { hour: number; count: number }[]; weekday_utc: { weekday: number; label: string; count: number }[]; sample_size: number };
  latency_by_key_event?: Record<string, LatencyBlock>;
  top_event_names: TopName[];
  recent_events: RecentEv[];
  reliability?: { success_true?: number; success_false?: number; observed_success_rate?: number | null; sample_size_with_boolean?: number };
  llm: {
    invocations: number; input_tokens: number; output_tokens: number; total_tokens: number;
    avg_latency_ms: number | null; latency_p50_ms?: number | null; latency_p95_ms?: number | null;
    estimated_cost_usd: number; by_model: { model: string; count: number }[];
    tokens_per_invocation_mean?: number | null; input_token_share_of_total?: number | null;
    estimated_cost_usd_per_1000_tokens?: number | null; model_concentration_herfindahl?: number;
  };
  daily_series?: DailySeries[];
  user_histogram?: { range: string; users: number }[];
  funnel?: { step: string; count: number }[];
  personalization?: Record<string, number>;
  heatmap?: HeatRow[];
  category_by_day?: Record<string, number>[];
  tools?: { top_tools: { tool: string; count: number }[]; invocations_with_tool_calls: number; invocations_without_tools: number; tool_call_rate: number | null };
  daily_tokens?: TokenDay[];
  lean_sample_rows?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [7, 30, 90] as const;

const COLORS = {
  emerald: "#10b981", teal: "#14b8a6", cyan: "#06b6d4", violet: "#8b5cf6",
  amber: "#f59e0b", rose: "#f43f5e", sky: "#38bdf8", slate: "#64748b",
  lime: "#84cc16", orange: "#fb923c", pink: "#ec4899", indigo: "#6366f1",
};

const SERIES_COLORS: Record<string, string> = {
  supervisor: COLORS.emerald, assistant: COLORS.violet, uploads: COLORS.cyan,
  exports: COLORS.amber, sessions: COLORS.teal, threads: COLORS.sky,
  auth: COLORS.rose, total: COLORS.slate,
};

const CAT_COLORS: Record<string, string> = {
  supervisor: COLORS.emerald, assistant: COLORS.violet, chat: COLORS.teal,
  storage: COLORS.cyan, export: COLORS.amber, auth: COLORS.rose,
  thread: COLORS.sky, custom_space: COLORS.lime, memory: COLORS.indigo,
  other: COLORS.slate,
};

// ─── Formatters ───────────────────────────────────────────────────────────────

function fInt(n: number) { return new Intl.NumberFormat("es-PE").format(n); }
function fPct(x: number | null | undefined, digits = 1) {
  if (x == null || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(digits)} %`;
}
function fDate(iso: string) {
  try { return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}
function shortDate(iso: string) {
  try { return iso.slice(5); } catch { return iso; }
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function Section({ id, icon, title, subtitle, children, wide }: {
  id?: string; icon: ReactNode; title: string; subtitle?: string; children: ReactNode; wide?: boolean;
}) {
  return (
    <section id={id} className={`rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden ${wide ? "col-span-full" : ""}`}>
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/70">
        <div className="flex items-start gap-3">
          <span className="text-emerald-500 mt-0.5 shrink-0">{icon}</span>
          <div>
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function KpiCard({ icon, label, value, sub, accent = "text-white" }: {
  icon: ReactNode; label: string; value: string; sub: string; accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
      <div className="text-emerald-500 mb-2">{icon}</div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium leading-tight">{label}</p>
      <p className={`text-xl font-bold mt-1 ${accent}`}>{value}</p>
      <p className="text-[10px] text-slate-600 mt-1">{sub}</p>
    </div>
  );
}

const ChartTooltipStyle = {
  contentStyle: { background: "#0f172a", border: "1px solid #334155", borderRadius: 10, fontSize: 11 },
  labelStyle: { color: "#94a3b8" },
  itemStyle: { color: "#e2e8f0" },
};

// ─── Chart: Multi-line daily learning interactions ─────────────────────────────

function DailyInteractionsChart({ data }: { data: DailySeries[] }) {
  const series = [
    { key: "supervisor", name: "Supervisor IA", color: SERIES_COLORS.supervisor },
    { key: "assistant", name: "Asistente", color: SERIES_COLORS.assistant },
    { key: "sessions", name: "Sesiones", color: SERIES_COLORS.sessions },
    { key: "uploads", name: "Subidas", color: SERIES_COLORS.uploads },
    { key: "exports", name: "Exportaciones", color: SERIES_COLORS.exports },
    { key: "threads", name: "Hilos nuevos", color: SERIES_COLORS.threads },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 9, fill: "#64748b" }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
        <Tooltip {...ChartTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
        {series.map(s => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={1.8} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Stacked bar - category by day ─────────────────────────────────────

function CategoryByDayChart({ data }: { data: Record<string, number>[] }) {
  const keys = ["supervisor", "assistant", "chat", "storage", "export", "auth", "custom_space", "memory", "other"];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }} barSize={4} maxBarSize={12}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 9, fill: "#64748b" }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
        <Tooltip {...ChartTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 9, color: "#94a3b8" }} />
        {keys.map(k => (
          <Bar key={k} dataKey={k} name={k} stackId="a" fill={CAT_COLORS[k] ?? COLORS.slate} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Token consumption area ────────────────────────────────────────────

function TokenTrendChart({ data }: { data: TokenDay[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.violet} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.violet} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 9, fill: "#64748b" }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
        <Tooltip {...ChartTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
        <Area type="monotone" dataKey="input" name="Tokens entrada" stroke={COLORS.emerald} fill="url(#gIn)" strokeWidth={1.8} />
        <Area type="monotone" dataKey="output" name="Tokens salida" stroke={COLORS.violet} fill="url(#gOut)" strokeWidth={1.8} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: User activity distribution ────────────────────────────────────────

function UserHistogramChart({ data }: { data: { range: string; users: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="range" tick={{ fontSize: 9, fill: "#64748b" }} />
        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
        <Tooltip {...ChartTooltipStyle} />
        <Bar dataKey="users" name="Usuarios" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS.teal} opacity={0.7 + (i / data.length) * 0.3} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Tool usage ────────────────────────────────────────────────────────

function ToolUsageChart({ data }: { data: { tool: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 26)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b" }} />
        <YAxis type="category" dataKey="tool" tick={{ fontSize: 9, fill: "#94a3b8" }} width={120} />
        <Tooltip {...ChartTooltipStyle} />
        <Bar dataKey="count" name="Llamadas" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={Object.values(COLORS)[i % Object.values(COLORS).length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Pie – category composition ────────────────────────────────────────

function CategoryPieChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const pieData = entries.map(([k, v]) => ({ name: k, value: v, fill: CAT_COLORS[k] ?? COLORS.slate }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={pieData} cx="50%" cy="50%" innerRadius="45%" outerRadius="75%"
          dataKey="value" nameKey="name" paddingAngle={2} labelLine={false}>
          {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.85} />)}
        </Pie>
        <Tooltip {...ChartTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Heatmap 7×24 ──────────────────────────────────────────────────────

function UsageHeatmap({ data }: { data: HeatRow[] }) {
  const allValues = data.flatMap(r => r.hours);
  const max = Math.max(...allValues, 1);
  const toColor = (v: number) => {
    const t = v / max;
    if (t === 0) return "#1e293b";
    if (t < 0.2) return "#064e3b";
    if (t < 0.4) return "#065f46";
    if (t < 0.6) return "#047857";
    if (t < 0.8) return "#059669";
    return "#10b981";
  };
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        <div className="flex gap-0.5 mb-1 ml-10">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-[8px] text-slate-600 text-center">{h % 6 === 0 ? `${h}h` : ""}</div>
          ))}
        </div>
        {data.map((row) => (
          <div key={row.label} className="flex items-center gap-0.5 mb-0.5">
            <span className="w-10 text-[9px] text-slate-500 text-right pr-1">{row.label}</span>
            {row.hours.map((v, h) => (
              <div
                key={h}
                className="flex-1 aspect-square rounded-sm"
                style={{ backgroundColor: toColor(v) }}
                title={`${row.label} ${h}:00 UTC — ${v} eventos`}
              />
            ))}
          </div>
        ))}
        <div className="flex justify-end gap-2 mt-2 items-center">
          <span className="text-[9px] text-slate-600">Menos</span>
          {["#1e293b", "#064e3b", "#065f46", "#047857", "#059669", "#10b981"].map(c => (
            <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[9px] text-slate-600">Más</span>
        </div>
      </div>
    </div>
  );
}

// ─── Chart: Radar – system capabilities ───────────────────────────────────────

function SystemRadarChart({ data }: { data: DashboardData }) {
  const ped = (data.pedagogical_mediation ?? {}) as Record<string, number>;
  const total = data.totals.interaction_events || 1;
  const radarData = [
    { metric: "Adopción", value: Math.min(100, ((data.adoption_reach?.unique_active_users_in_sample ?? 0) / Math.max(1, data.totals.users ?? 1)) * 100) },
    { metric: "Mediación IA", value: Math.min(100, (Number(ped.supervisor_invocations ?? 0) + Number(ped.assistant_chat_invocations ?? 0)) / total * 100 * 10) },
    { metric: "Artefactos", value: Math.min(100, Number(ped.artefact_events_share_of_all ?? 0) * 1000) },
    { metric: "Fiabilidad", value: (data.reliability?.observed_success_rate ?? 0) * 100 },
    { metric: "Personalización", value: Math.min(100, ((data.personalization?.personalization_total ?? 0) / total) * 1000) },
    { metric: "Uso diálogo", value: Math.min(100, Number(ped.chat_related_category_weight ?? 0) * 100 * 5) },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="#1e293b" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#94a3b8" }} />
        <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
        <Radar name="Sistema" dataKey="value" stroke={COLORS.emerald} fill={COLORS.emerald} fillOpacity={0.25} strokeWidth={2} />
        <Tooltip
          {...ChartTooltipStyle}
          formatter={(value) =>
            typeof value === "number" ? `${value.toFixed(1)} pts` : String(value ?? "")
          }
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: LLM Latency comparison bar ────────────────────────────────────────

function LatencyComparisonChart({ data }: { data: Record<string, LatencyBlock> }) {
  const chartData = Object.entries(data).map(([name, lb]) => ({
    name: name.replace("api.", "").replace(".invoke", "").replace("auth.login.", "login."),
    p50: lb.p50_ms ?? 0,
    p95: lb.p95_ms ?? 0,
    mean: lb.mean_ms ?? 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} />
        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} unit="ms" />
        <Tooltip {...ChartTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
        <Bar dataKey="p50" name="p50 ms" fill={COLORS.emerald} radius={[4, 4, 0, 0]} barSize={18} />
        <Bar dataKey="p95" name="p95 ms" fill={COLORS.amber} radius={[4, 4, 0, 0]} barSize={18} />
        <Line type="monotone" dataKey="mean" name="Media ms" stroke={COLORS.rose} strokeWidth={2} dot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Auth success/failure composed ─────────────────────────────────────

function AuthReliabilityChart({ data }: { data: DashboardData }) {
  const pieData = [
    { name: "Éxito", value: data.auth.login_success, fill: COLORS.emerald },
    { name: "Fallo",  value: data.auth.login_failure, fill: COLORS.rose },
  ];
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={pieData} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" dataKey="value" paddingAngle={3}>
          {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.85} />)}
        </Pie>
        <Tooltip {...ChartTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Personalization treemap ───────────────────────────────────────────

function PersonalizationTreemap({ data }: { data: Record<string, number> }) {
  const items = [
    { name: "Asistentes", size: data.assistant_events ?? 0, fill: COLORS.violet },
    { name: "Chat", size: data.chat_events ?? 0, fill: COLORS.teal },
    { name: "Espacio propio", size: data.custom_space_updates ?? 0, fill: COLORS.lime },
    { name: "Memoria", size: data.memory_events ?? 0, fill: COLORS.indigo },
    { name: "Archivos", size: data.storage_events ?? 0, fill: COLORS.cyan },
    { name: "Sesiones", size: data.session_events ?? 0, fill: COLORS.emerald },
  ].filter(x => x.size > 0);
  if (!items.length) return <p className="text-xs text-slate-500 pt-4">Sin datos suficientes.</p>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <Treemap data={items} dataKey="size" aspectRatio={4 / 2} stroke="#0f172a" isAnimationActive={false}>
        {items.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.82} />)}
        <Tooltip
          {...ChartTooltipStyle}
          formatter={(value) =>
            typeof value === "number" ? fInt(value) : String(value ?? "")
          }
        />
      </Treemap>
    </ResponsiveContainer>
  );
}

// ─── Chart: Model usage horizontal bars ───────────────────────────────────────

function ModelUsageChart({ data }: { data: { model: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 28)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b" }} />
        <YAxis type="category" dataKey="model" tick={{ fontSize: 9, fill: "#94a3b8" }} width={130} />
        <Tooltip {...ChartTooltipStyle} />
        <Bar dataKey="count" name="Invocaciones" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS.emerald} opacity={0.6 + (i / data.length) * 0.4} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Weekly activity line ──────────────────────────────────────────────

function WeekdayActivityChart({ data }: { data: { weekday: number; label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
        <Tooltip {...ChartTooltipStyle} />
        <Bar dataKey="count" name="Eventos" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.weekday < 5 ? COLORS.emerald : COLORS.amber} opacity={0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Hourly pattern line ────────────────────────────────────────────────

function HourlyActivityChart({ data }: { data: { hour: number; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gHour" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.4} />
            <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#64748b" }} tickFormatter={(h) => `${h}h`} />
        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
        <Tooltip {...ChartTooltipStyle} labelFormatter={(h) => `${h}:00 UTC`} />
        <Area type="monotone" dataKey="count" name="Eventos" stroke={COLORS.teal} fill="url(#gHour)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Chart: Funnel Recharts native ────────────────────────────────────────────

function RechartsFunnel({ data }: { data: { step: string; count: number }[] }) {
  const FUNNEL_COLORS = [COLORS.emerald, COLORS.teal, COLORS.cyan, COLORS.violet, COLORS.amber, COLORS.rose];
  const funData = data.map((d, i) => ({ ...d, value: d.count, fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <FunnelChart>
        <Tooltip {...ChartTooltipStyle} />
        <Funnel dataKey="value" data={funData} isAnimationActive={false}>
          {funData.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.85} />)}
          <LabelList position="center" content={({ value, name }) => (
            <text fill="#e2e8f0" fontSize={10} textAnchor="middle">
              {String(name).slice(0, 28)}: {fInt(Number(value))}
            </text>
          )} />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [token, setToken]   = useState<string | null>(null);
  const [days, setDays]     = useState<number>(30);
  const [data, setData]     = useState<DashboardData | null>(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    if (!t) { window.location.href = "/"; return; }
    if (getUserTypeFromToken(t) !== "admin") { window.location.href = "/"; return; }
    setToken(t);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoad(true); setError(null);
    try {
      const res  = await fetch(`/api/admin/analytics/dashboard?days=${days}`, { headers: { Token: token } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Error");
      setData(json);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); setData(null); }
    finally { setLoad(false); }
  }, [token, days]);

  useEffect(() => { if (token) load(); }, [token, load]);

  const ped = (data?.pedagogical_mediation ?? {}) as Record<string, number>;

  const categoryPieSrc = useMemo(() => {
    if (!data?.events_by_category) return {};
    return Object.fromEntries(Object.entries(data.events_by_category).filter(([, v]) => v > 0));
  }, [data]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <ChatHeader token={token} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-28">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-3 min-w-0">
            <Link href="/" className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white mt-1 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <GraduationCap className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Informe analítico</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {data?.academic?.document_title_suggestion ?? "Métricas educativas del sistema IA"}
              </h1>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Indicadores de adopción, mediación pedagógica, personalización, fiabilidad y carga computacional. Zona horaria: UTC.
                Muestra lean: {fInt(data?.lean_sample_rows ?? 0)} eventos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="text-xs text-slate-500">Ventana</span>
            {DAY_OPTIONS.map(d => (
              <button key={d} type="button" onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${days === d ? "bg-emerald-600 text-white" : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
                {d} d
              </button>
            ))}
            <Link href="/admin/import-users" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-slate-800 border border-slate-600 text-slate-300">
              <FileSpreadsheet className="w-4 h-4" /> Importar
            </Link>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-sm">{error}</div>}

        {loading && !data && (
          <div className="flex flex-col items-center py-24 text-slate-500">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            Calculando métricas…
          </div>
        )}

        {data && (<>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <KpiCard icon={<Users className="w-5 h-5" />} label="Usuarios registrados" value={data.totals.users != null ? fInt(data.totals.users) : "—"} sub="Total BD" />
            <KpiCard icon={<Users className="w-5 h-5" />} label="Activos (muestra)" value={fInt(data.adoption_reach?.unique_active_users_in_sample ?? 0)} sub={`Altas nuevas: ${fInt(data.adoption_reach?.new_user_accounts_in_period ?? 0)}`} />
            <KpiCard icon={<Bot className="w-5 h-5" />} label="Asistentes" value={data.totals.assistants != null ? fInt(data.totals.assistants) : "—"} sub="Catálogo global" />
            <KpiCard icon={<Sparkles className="w-5 h-5" />} label="Diálogos IA" value={fInt(Number(ped.supervisor_invocations ?? 0) + Number(ped.assistant_chat_invocations ?? 0))} sub={`Sup. ${fInt(Number(ped.supervisor_invocations ?? 0))} / Asist. ${fInt(Number(ped.assistant_chat_invocations ?? 0))}`} accent="text-emerald-300" />
            <KpiCard icon={<KeyRound className="w-5 h-5" />} label="Tasa login OK" value={fPct(data.adoption_reach?.login_success_rate)} sub={`${fInt(data.adoption_reach?.login_attempts_observed ?? 0)} intentos`} />
            <KpiCard icon={<ShieldCheck className="w-5 h-5" />} label="Fiabilidad obs." value={fPct(data.reliability?.observed_success_rate)} sub={`n = ${fInt(data.reliability?.sample_size_with_boolean ?? 0)}`} accent="text-emerald-300" />
          </div>

          {/* ── Row 1: Interacciones diarias + stacked ── */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Section icon={<TrendingUp className="w-4 h-4" />}
              title="1 · Interacciones pedagógicas diarias"
              subtitle="Series temporales de supervisor IA, asistentes, sesiones, subidas y exportaciones.">
              {data.daily_series?.length ? <DailyInteractionsChart data={data.daily_series} /> : <Empty />}
            </Section>
            <Section icon={<Layers className="w-4 h-4" />}
              title="2 · Composición de actividad por día (stacked)"
              subtitle="Cada barra muestra la distribución funcional del volumen de eventos.">
              {data.category_by_day?.length ? <CategoryByDayChart data={data.category_by_day} /> : <Empty />}
            </Section>
          </div>

          {/* ── Row 2: Funnel + Radar ── */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Section icon={<GraduationCap className="w-4 h-4" />}
              title="3 · Embudo del proceso de aprendizaje"
              subtitle="Conversión entre etapas del flujo educativo (sesión → hilo → IA → material → exportación).">
              {data.funnel?.length ? <RechartsFunnel data={data.funnel.map(f => ({ ...f, name: f.step }))} /> : <Empty />}
            </Section>
            <Section icon={<BarChart3 className="w-4 h-4" />}
              title="4 · Radar de capacidades del sistema"
              subtitle="Puntuación multidimensional: adopción, mediación IA, artefactos, fiabilidad, personalización y peso de diálogo.">
              <SystemRadarChart data={data} />
            </Section>
          </div>

          {/* ── Row 3: Tokens diarios + distribución de usuarios ── */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Section icon={<Cpu className="w-4 h-4" />}
              title="5 · Consumo de tokens LLM por día"
              subtitle="Área apilada de tokens de entrada (prompt) y salida (respuesta). Indicador de carga cognitiva del modelo.">
              {data.daily_tokens?.length ? <TokenTrendChart data={data.daily_tokens} /> : <Empty />}
            </Section>
            <Section icon={<Users className="w-4 h-4" />}
              title="6 · Distribución de usuarios por intensidad de uso"
              subtitle="Histograma: cuántos usuarios caen en cada rango de eventos generados (proxy de compromiso/engagement).">
              {data.user_histogram?.length ? <UserHistogramChart data={data.user_histogram} /> : <Empty />}
            </Section>
          </div>

          {/* ── Row 4: Heatmap + Weekday + Hourly ── */}
          <div className="grid lg:grid-cols-3 gap-4 mb-4">
            <Section icon={<Clock className="w-4 h-4" />}
              title="7 · Mapa de calor semanal (7 × 24 UTC)"
              subtitle="Intensidad de uso por día y hora. Identifica franjas de uso académico activo." wide={false}>
              {data.heatmap?.length ? <UsageHeatmap data={data.heatmap} /> : <Empty />}
            </Section>
            <Section icon={<BarChart3 className="w-4 h-4" />}
              title="8 · Actividad por día de la semana"
              subtitle="Verde = días laborables · Ámbar = fin de semana.">
              {data.temporal_patterns?.weekday_utc?.length
                ? <WeekdayActivityChart data={data.temporal_patterns.weekday_utc} />
                : <Empty />}
            </Section>
            <Section icon={<Clock className="w-4 h-4" />}
              title="9 · Patrón horario (UTC)"
              subtitle="Distribución de eventos por hora del día.">
              {data.temporal_patterns?.hourly_utc?.length
                ? <HourlyActivityChart data={data.temporal_patterns.hourly_utc} />
                : <Empty />}
            </Section>
          </div>

          {/* ── Row 5: Personalización treemap + Pie categorías ── */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Section icon={<Sparkles className="w-4 h-4" />}
              title="10 · Personalización del aprendizaje (treemap)"
              subtitle="Proporción relativa de eventos de asistentes, chat, espacio propio, memoria, archivos y sesiones.">
              {data.personalization ? <PersonalizationTreemap data={data.personalization} /> : <Empty />}
            </Section>
            <Section icon={<Layers className="w-4 h-4" />}
              title="11 · Composición por categoría funcional (donut)"
              subtitle="Peso relativo de cada área funcional sobre el total de eventos del periodo.">
              <CategoryPieChart data={categoryPieSrc} />
            </Section>
          </div>

          {/* ── Row 6: Herramientas + Latencia ── */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Section icon={<Zap className="w-4 h-4" />}
              title="12 · Herramientas del agente más invocadas"
              subtitle={`Llamadas a tools del supervisor IA. Tasa de uso de herramientas: ${fPct(data.tools?.tool_call_rate)}`}>
              {data.tools?.top_tools?.length
                ? <ToolUsageChart data={data.tools.top_tools} />
                : <p className="text-xs text-slate-500 pt-2">Sin invocaciones de herramientas registradas en el periodo.</p>}
            </Section>
            <Section icon={<Zap className="w-4 h-4" />}
              title="13 · Latencia por tipo de evento clave (p50 / p95 / media)"
              subtitle="Comparación de percentiles de tiempo de respuesta. Indicador de calidad de servicio percibida.">
              {data.latency_by_key_event && Object.keys(data.latency_by_key_event).length
                ? <LatencyComparisonChart data={data.latency_by_key_event} />
                : <Empty />}
            </Section>
          </div>

          {/* ── Row 7: Modelos LLM + Auth reliability ── */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            <Section icon={<Cpu className="w-4 h-4" />}
              title="14 · Uso por modelo generativo"
              subtitle={`Herfindahl: ${data.llm.model_concentration_herfindahl ?? "—"} · Tokens / invocación: ${data.llm.tokens_per_invocation_mean ?? "—"}`}>
              {data.llm.by_model?.length ? <ModelUsageChart data={data.llm.by_model} /> : <Empty />}
            </Section>
            <Section icon={<ShieldCheck className="w-4 h-4" />}
              title="15 · Fiabilidad de autenticación"
              subtitle={`Inicio de sesión: ${data.auth.login_success} éxitos / ${data.auth.login_failure} fallos.`}>
              <AuthReliabilityChart data={data} />
            </Section>
          </div>

          {/* ── Row 8: Top eventos + Tabla reciente ── */}
          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <Section icon={<BarChart3 className="w-4 h-4" />} title="16 · Eventos más frecuentes (ranking)">
              <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar-dark">
                {data.top_event_names.map((t, i) => {
                  const maxC = data.top_event_names[0]?.count ?? 1;
                  return (
                    <div key={t.event_name} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-slate-600 text-right">{i + 1}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-600/80" style={{ width: `${(t.count / maxC) * 100}%` }} />
                      </div>
                      <span className="font-mono text-slate-400 truncate w-48">{t.event_name}</span>
                      <span className="text-slate-200 w-12 text-right">{fInt(t.count)}</span>
                    </div>
                  );
                })}
              </div>
            </Section>
            <Section icon={<Scale className="w-4 h-4" />} title="17 · Registro de eventos recientes (auditoría)">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[520px]">
                  <thead>
                    <tr className="text-slate-600 border-b border-slate-800">
                      <th className="pb-2 pr-2">Cuando</th>
                      <th className="pb-2 pr-2">Categoría</th>
                      <th className="pb-2 pr-2">Evento</th>
                      <th className="pb-2">OK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_events.slice(0, 20).map(ev => (
                      <tr key={ev.id} className="border-b border-slate-800/40 text-slate-400 hover:bg-slate-900/30">
                        <td className="py-1.5 pr-2 whitespace-nowrap">{fDate(ev.occurred_at)}</td>
                        <td className="py-1.5 pr-2 text-emerald-500/80">{ev.event_category}</td>
                        <td className="py-1.5 pr-2 font-mono text-[11px] max-w-[200px] truncate">{ev.event_name}</td>
                        <td className="py-1.5">
                          {ev.success === true && <span className="text-emerald-400">✓</span>}
                          {ev.success === false && <span className="text-red-400">✗</span>}
                          {ev.success == null && <span className="text-slate-700">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          {/* Definitions accordion-style */}
          {data.academic?.definitions && (
            <Section id="definiciones" icon={<BookOpen className="w-4 h-4" />}
              title="Definiciones operacionales"
              subtitle="Para la sección de métodos de publicaciones académicas.">
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(data.academic.definitions).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                    <p className="text-[10px] font-mono text-emerald-500 mb-1">{k}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{v}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <p className="text-center text-[10px] text-slate-600 mt-8 leading-relaxed max-w-2xl mx-auto">
            Periodo: {fDate(data.period_start)} — {fDate(data.period_end)} · Muestra lean: {fInt(data.lean_sample_rows ?? 0)} eventos.
            Estas métricas son descriptivas; para inferencia causal se requieren diseños experimentales adicionales.
          </p>
        </>)}
      </main>

      <ChatFooter />
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-slate-600 py-6 text-center">Sin datos suficientes para este periodo.</p>;
}
