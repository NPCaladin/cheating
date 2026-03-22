"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, AlertTriangle, FileText, Activity,
  Clock, Users, Zap, Archive, ChevronLeft, ChevronRight,
  Search, X, Calendar, Eye,
} from "lucide-react";

/* ─── Types ─── */

interface DailyStats { date: string; count: number; high_count: number }
interface ScamType { scam_type: string; count: number }
interface HourlyItem { hour: number; count: number }
interface SignalItem { signal: string; count: number }
interface MonthlyItem { month: string; count: number; high_count: number }

interface RecentLog {
  id: string;
  created_at: string;
  type: string;
  risk_level: string;
  risk_score: number;
  scam_type: string | null;
  input_preview: string | null;
  input_length: number | null;
  meta_title: string | null;
  meta_channel: string | null;
  url_domain: string | null;
  response_time_ms: number | null;
  detected_signals_count: number | null;
  ai_result: Record<string, unknown> | null;
  error: boolean | null;
  ip_hash: string | null;
}

interface Stats {
  period: { from: string; to: string; days: number };
  today: { total: number; high: number };
  total: { total: number; high: number };
  period_total: number;
  pending_reports: number;
  daily_stats: DailyStats[];
  scam_types: ScamType[];
  recent_logs: RecentLog[];
  logs_total: number;
  logs_offset: number;
  logs_limit: number;
  type_distribution: { text: number; youtube: number; sns: number };
  hourly_distribution: HourlyItem[];
  risk_score_distribution: { safe: number; low: number; medium: number; high: number; critical: number };
  avg_response_time_ms: number;
  error_rate: number;
  unique_users_today: number;
  unique_users_period: number;
  avg_input_length: number;
  top_signals: SignalItem[];
  archive_count: number;
  monthly_stats: MonthlyItem[];
}

/* ─── Constants ─── */

const riskColor: Record<string, string> = {
  safe: "text-green-400", low: "text-blue-400", medium: "text-amber-400",
  high: "text-orange-400", critical: "text-red-400",
};
const riskBg: Record<string, string> = {
  safe: "bg-green-400/10 border-green-400/20", low: "bg-blue-400/10 border-blue-400/20",
  medium: "bg-amber-400/10 border-amber-400/20", high: "bg-orange-400/10 border-orange-400/20",
  critical: "bg-red-400/10 border-red-400/20",
};
const riskLabel: Record<string, string> = {
  safe: "안전", low: "낮음", medium: "주의", high: "위험", critical: "극위험",
};
const typeLabel: Record<string, string> = { text: "텍스트", youtube: "유튜브", sns: "SNS" };

const tabs = ["개요", "트래픽", "분석 품질", "분석 로그"] as const;
type Tab = (typeof tabs)[number];

const PRESET_RANGES = [
  { label: "7일", days: 7 },
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
  { label: "전체", days: 0 },
] as const;

function toDateStr(d: Date): string { return d.toISOString().slice(0, 10); }

/* ─── AI Result Sub-component ─── */

interface AiSignal { signal?: string; severity?: string; evidence?: string }
interface AiResultData { summary?: string; verdict?: string; detectedSignals?: AiSignal[]; recommendation?: string; [k: string]: unknown }

function AiResultView({ result, onClose }: { result: Record<string, unknown>; onClose: () => void }) {
  const r = result as AiResultData;
  const signals = Array.isArray(r.detectedSignals) ? r.detectedSignals : [];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[#8b949e] text-xs font-medium">AI 분석 결과</h4>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-[#8b949e] text-xs hover:text-[#e6edf3]">닫기</button>
      </div>
      <div className="bg-[#161b22] rounded-lg p-3 space-y-3 text-xs">
        {r.summary && (
          <div><span className="text-[#f0a500] font-medium">요약: </span><span className="text-[#e6edf3]">{String(r.summary)}</span></div>
        )}
        {r.verdict && (
          <div><span className="text-[#8b949e]">판정: </span><span className="text-[#e6edf3] font-medium">{String(r.verdict)}</span></div>
        )}
        {signals.length > 0 && (
          <div>
            <span className="text-red-400 font-medium">감지된 위험 신호:</span>
            <ul className="mt-1 space-y-1 ml-3">
              {signals.map((s, i) => (
                <li key={i} className="text-[#e6edf3]">
                  <span className={`font-medium ${s.severity === "high" ? "text-red-400" : s.severity === "medium" ? "text-amber-400" : "text-blue-400"}`}>
                    [{s.severity}]
                  </span>{" "}
                  {s.signal}
                  {s.evidence && <span className="text-[#8b949e] block ml-2 text-[10px]">&quot;{s.evidence}&quot;</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {r.recommendation && (
          <div><span className="text-green-400 font-medium">권장 조치: </span><span className="text-[#e6edf3]">{String(r.recommendation)}</span></div>
        )}
        <details className="mt-2">
          <summary className="text-[#8b949e] cursor-pointer hover:text-[#e6edf3] text-[10px]">전체 JSON 보기</summary>
          <pre className="text-[#e6edf3] text-[10px] leading-relaxed whitespace-pre-wrap break-all mt-2 max-h-60 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

/* ─── Component ─── */

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("개요");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  // 기간 선택
  const [dateFrom, setDateFrom] = useState(toDateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [dateTo, setDateTo] = useState(toDateStr(new Date()));
  const [activePreset, setActivePreset] = useState<number>(30);

  // 로그 페이징
  const [logPage, setLogPage] = useState(0);
  const LOG_PER_PAGE = 50;

  // 로그 검색
  const [logSearch, setLogSearch] = useState("");

  const fetchStats = useCallback(async (from: string, to: string, offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from, to,
        log_limit: String(LOG_PER_PAGE),
        log_offset: String(offset),
      });
      const r = await fetch(`/api/admin/stats?${params}`);
      if (r.status === 401) { router.push("/admin/login"); return; }
      const d = await r.json();
      if (d) setStats(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    fetchStats(dateFrom, dateTo, logPage * LOG_PER_PAGE);
  }, [dateFrom, dateTo, logPage, fetchStats]);

  const applyPreset = (days: number) => {
    setActivePreset(days);
    setLogPage(0);
    if (days === 0) {
      setDateFrom("2025-01-01");
      setDateTo(toDateStr(new Date()));
    } else {
      setDateFrom(toDateStr(new Date(Date.now() - days * 24 * 60 * 60 * 1000)));
      setDateTo(toDateStr(new Date()));
    }
  };

  const handleArchive = async () => {
    if (!confirm("90일 경과 로그를 아카이브로 이관합니다. 진행할까요?")) return;
    setArchiving(true);
    try {
      const res = await fetch("/api/admin/archive", { method: "POST" });
      const data = await res.json();
      alert(data.message || "완료");
      fetchStats(dateFrom, dateTo);
    } catch { alert("아카이브 실행 실패"); }
    finally { setArchiving(false); }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-[#8b949e] text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (!stats) return null;

  const maxDaily = Math.max(...stats.daily_stats.map((d) => d.count), 1);
  const maxType = Math.max(...stats.scam_types.map((t) => t.count), 1);
  const highRate = stats.total.total > 0
    ? Math.round((stats.total.high / stats.total.total) * 100) : 0;
  const periodHighCount = stats.daily_stats.reduce((s, d) => s + d.high_count, 0);

  // 로그 필터링 (클라이언트 사이드 검색)
  const filteredLogs = logSearch
    ? stats.recent_logs.filter((l) =>
        (l.input_preview?.toLowerCase().includes(logSearch.toLowerCase())) ||
        (l.meta_title?.toLowerCase().includes(logSearch.toLowerCase())) ||
        (l.meta_channel?.toLowerCase().includes(logSearch.toLowerCase())) ||
        (l.scam_type?.toLowerCase().includes(logSearch.toLowerCase())) ||
        (l.url_domain?.toLowerCase().includes(logSearch.toLowerCase()))
      )
    : stats.recent_logs;

  const totalLogPages = Math.ceil((stats.logs_total || 1) / LOG_PER_PAGE);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[#e6edf3] font-semibold text-lg">대시보드</h1>
          <p className="text-[#8b949e] text-xs mt-0.5">
            {stats.period.days}일간 ({dateFrom} ~ {dateTo}) | 조회: {stats.period_total}건
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleArchive} disabled={archiving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[#30363d] bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#8b949e] transition disabled:opacity-50">
            <Archive size={12} />
            {archiving ? "처리 중..." : "90일 아카이브"}
          </button>
        </div>
      </div>

      {/* 기간 선택 */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_RANGES.map(({ label, days }) => (
          <button key={days} onClick={() => applyPreset(days)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition ${
              activePreset === days
                ? "border-[#f0a500] bg-[#f0a500]/10 text-[#f0a500]"
                : "border-[#30363d] bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
            }`}>
            {label}
          </button>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <Calendar size={12} className="text-[#8b949e]" />
          <input type="date" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setActivePreset(-1); setLogPage(0); }}
            className="bg-[#21262d] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#e6edf3] focus:border-[#f0a500] outline-none" />
          <span className="text-[#8b949e] text-xs">~</span>
          <input type="date" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setActivePreset(-1); setLogPage(0); }}
            className="bg-[#21262d] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#e6edf3] focus:border-[#f0a500] outline-none" />
        </div>
        {loading && <span className="text-[#8b949e] text-xs animate-pulse ml-2">로딩 중...</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#21262d]">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition ${
              activeTab === tab
                ? "border-[#f0a500] text-[#e6edf3]"
                : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ═══ Tab: 개요 ═══ */}
      {activeTab === "개요" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "기간 분석", value: stats.period_total, sub: `위험 ${periodHighCount}건`, icon: Activity, color: "text-blue-400", bg: "bg-blue-400/5 border-blue-400/20" },
              { label: "누적 분석", value: stats.total.total, sub: `위험 ${stats.total.high}건`, icon: TrendingUp, color: "text-[#f0a500]", bg: "bg-[#f0a500]/5 border-[#f0a500]/20" },
              { label: "위험 감지율", value: `${highRate}%`, sub: "high + critical", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/5 border-red-400/20" },
              { label: "미처리 제보", value: stats.pending_reports, sub: "처리 필요", icon: FileText, color: "text-amber-400", bg: "bg-amber-400/5 border-amber-400/20" },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-xl border ${bg} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#8b949e] text-xs">{label}</span>
                  <Icon size={14} className={color} />
                </div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-[#8b949e] text-xs mt-1">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily chart */}
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
              <h2 className="text-[#e6edf3] text-sm font-medium mb-4">일별 분석 추이</h2>
              <div className="flex items-end gap-[2px] h-32">
                {stats.daily_stats.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center" title={`${d.date}: ${d.count}건 (위험 ${d.high_count})`}>
                    <div className="w-full flex flex-col-reverse gap-0" style={{ height: "96px" }}>
                      <div className="w-full bg-red-400/40 rounded-t-sm" style={{ height: `${Math.round((d.high_count / maxDaily) * 96)}px` }} />
                      <div className="w-full bg-[#f0a500]/40 rounded-t-sm" style={{ height: `${Math.round(((d.count - d.high_count) / maxDaily) * 96)}px` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[#8b949e] text-[10px]">{stats.daily_stats[0]?.date.slice(5).replace("-", "/")}</span>
                <span className="text-[#8b949e] text-[10px]">{stats.daily_stats[stats.daily_stats.length - 1]?.date.slice(5).replace("-", "/")}</span>
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]"><span className="w-2.5 h-2.5 rounded-sm bg-[#f0a500]/40" />일반</div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]"><span className="w-2.5 h-2.5 rounded-sm bg-red-400/40" />위험</div>
              </div>
            </div>

            {/* Risk score distribution */}
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
              <h2 className="text-[#e6edf3] text-sm font-medium mb-4">위험도 점수 분포</h2>
              {(() => {
                const dist = stats.risk_score_distribution;
                const maxDist = Math.max(dist.safe, dist.low, dist.medium, dist.high, dist.critical, 1);
                const items = [
                  { label: "안전 (0-20)", value: dist.safe, color: "bg-green-400/60" },
                  { label: "낮음 (21-40)", value: dist.low, color: "bg-blue-400/60" },
                  { label: "주의 (41-60)", value: dist.medium, color: "bg-amber-400/60" },
                  { label: "위험 (61-80)", value: dist.high, color: "bg-orange-400/60" },
                  { label: "극위험 (81-100)", value: dist.critical, color: "bg-red-400/60" },
                ];
                return (
                  <div className="space-y-3">
                    {items.map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#e6edf3]">{label}</span>
                          <span className="text-[#8b949e]">{value}건</span>
                        </div>
                        <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.round((value / maxDist) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Type distribution */}
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
              <h2 className="text-[#e6edf3] text-sm font-medium mb-4">분석 유형 비율</h2>
              {(() => {
                const td = stats.type_distribution;
                const total = td.text + td.youtube + td.sns;
                if (total === 0) return <p className="text-[#8b949e] text-xs">데이터가 없습니다.</p>;
                const items = [
                  { label: "텍스트", value: td.text, color: "bg-blue-400", textColor: "text-blue-400" },
                  { label: "유튜브", value: td.youtube, color: "bg-red-400", textColor: "text-red-400" },
                  { label: "SNS", value: td.sns, color: "bg-purple-400", textColor: "text-purple-400" },
                ];
                return (
                  <div className="space-y-4">
                    <div className="h-4 rounded-full overflow-hidden flex">
                      {items.map(({ label, value, color }) =>
                        value > 0 ? <div key={label} className={`${color}/60 h-full`} style={{ width: `${Math.round((value / total) * 100)}%` }} /> : null
                      )}
                    </div>
                    <div className="flex gap-6">
                      {items.map(({ label, value, textColor }) => (
                        <div key={label} className="text-center">
                          <div className={`text-lg font-bold ${textColor}`}>{value}</div>
                          <div className="text-[#8b949e] text-[10px]">{label} ({total > 0 ? Math.round((value / total) * 100) : 0}%)</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Scam type top 10 */}
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
              <h2 className="text-[#e6edf3] text-sm font-medium mb-4">사기 유형 Top 10</h2>
              {stats.scam_types.length === 0 ? (
                <p className="text-[#8b949e] text-xs">데이터가 없습니다.</p>
              ) : (
                <div className="space-y-2.5">
                  {stats.scam_types.map(({ scam_type, count }) => (
                    <div key={scam_type}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-[#e6edf3] truncate max-w-[70%]">{scam_type}</span>
                        <span className="text-[#8b949e]">{count}건</span>
                      </div>
                      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <div className="h-full bg-[#f0a500]/60 rounded-full" style={{ width: `${Math.round((count / maxType) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab: 트래픽 ═══ */}
      {activeTab === "트래픽" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
              <div className="flex items-center gap-2 mb-2"><Users size={14} className="text-blue-400" /><span className="text-[#8b949e] text-xs">오늘 고유 사용자</span></div>
              <div className="text-2xl font-bold text-blue-400">{stats.unique_users_today}</div>
            </div>
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
              <div className="flex items-center gap-2 mb-2"><Users size={14} className="text-purple-400" /><span className="text-[#8b949e] text-xs">기간 고유 사용자</span></div>
              <div className="text-2xl font-bold text-purple-400">{stats.unique_users_period}</div>
            </div>
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
              <div className="flex items-center gap-2 mb-2"><Archive size={14} className="text-[#8b949e]" /><span className="text-[#8b949e] text-xs">아카이브</span></div>
              <div className="text-2xl font-bold text-[#8b949e]">{stats.archive_count}</div>
              <div className="text-[#8b949e] text-[10px] mt-1">이관된 로그</div>
            </div>
          </div>

          {/* Hourly */}
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
            <h2 className="text-[#e6edf3] text-sm font-medium mb-4">시간대별 분석</h2>
            {(() => {
              const maxHour = Math.max(...stats.hourly_distribution.map((h) => h.count), 1);
              return (
                <div className="flex items-end gap-1 h-32">
                  {stats.hourly_distribution.map((h) => (
                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-1" title={`${h.hour}시: ${h.count}건`}>
                      <div className="w-full bg-blue-400/40 rounded-t-sm" style={{ height: `${Math.round((h.count / maxHour) * 96)}px` }} />
                      <span className="text-[#8b949e] text-[8px]">{h.hour % 6 === 0 ? `${h.hour}시` : ""}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Monthly */}
          {stats.monthly_stats.length > 0 && (
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
              <h2 className="text-[#e6edf3] text-sm font-medium mb-4">월간 추이</h2>
              {(() => {
                const maxMonth = Math.max(...stats.monthly_stats.map((m) => m.count), 1);
                return (
                  <div className="flex items-end gap-3 h-32">
                    {stats.monthly_stats.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col-reverse" style={{ height: "96px" }}>
                          <div className="w-full bg-red-400/40 rounded-t-sm" style={{ height: `${Math.round((m.high_count / maxMonth) * 96)}px` }} />
                          <div className="w-full bg-[#f0a500]/40 rounded-t-sm" style={{ height: `${Math.round(((m.count - m.high_count) / maxMonth) * 96)}px` }} />
                        </div>
                        <span className="text-[#8b949e] text-[10px]">{m.month.slice(5)}월</span>
                        <span className="text-[#8b949e] text-[9px]">{m.count}건</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: 분석 품질 ═══ */}
      {activeTab === "분석 품질" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
              <div className="flex items-center gap-2 mb-2"><Clock size={14} className="text-green-400" /><span className="text-[#8b949e] text-xs">평균 응답</span></div>
              <div className="text-2xl font-bold text-green-400">{stats.avg_response_time_ms > 0 ? `${(stats.avg_response_time_ms / 1000).toFixed(1)}s` : "-"}</div>
            </div>
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
              <div className="flex items-center gap-2 mb-2"><AlertTriangle size={14} className="text-red-400" /><span className="text-[#8b949e] text-xs">에러율</span></div>
              <div className="text-2xl font-bold text-red-400">{stats.error_rate}%</div>
            </div>
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
              <div className="flex items-center gap-2 mb-2"><FileText size={14} className="text-blue-400" /><span className="text-[#8b949e] text-xs">평균 입력</span></div>
              <div className="text-2xl font-bold text-blue-400">{stats.avg_input_length > 0 ? `${stats.avg_input_length}자` : "-"}</div>
            </div>
            <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
              <div className="flex items-center gap-2 mb-2"><Zap size={14} className="text-amber-400" /><span className="text-[#8b949e] text-xs">위험 신호 유형</span></div>
              <div className="text-2xl font-bold text-amber-400">{stats.top_signals.length}</div>
            </div>
          </div>

          <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
            <h2 className="text-[#e6edf3] text-sm font-medium mb-4">가장 많이 감지된 위험 신호 Top 10</h2>
            {stats.top_signals.length === 0 ? (
              <p className="text-[#8b949e] text-xs">데이터가 없습니다.</p>
            ) : (
              <div className="space-y-2.5">
                {(() => {
                  const maxSig = Math.max(...stats.top_signals.map((s) => s.count), 1);
                  return stats.top_signals.map(({ signal, count }, i) => (
                    <div key={signal}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-[#e6edf3] truncate max-w-[75%]"><span className="text-[#8b949e] mr-1.5">{i + 1}.</span>{signal}</span>
                        <span className="text-[#8b949e]">{count}건</span>
                      </div>
                      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400/60 rounded-full" style={{ width: `${Math.round((count / maxSig) * 100)}%` }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Tab: 분석 로그 ═══ */}
      {activeTab === "분석 로그" && (
        <div className="space-y-4">
          {/* Search + Pagination header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
              <input
                type="text" value={logSearch} onChange={(e) => setLogSearch(e.target.value)}
                placeholder="콘텐츠, 유형, 도메인으로 검색..."
                className="w-full bg-[#21262d] border border-[#30363d] rounded-lg pl-9 pr-8 py-2 text-xs text-[#e6edf3] placeholder-[#8b949e] focus:border-[#f0a500] outline-none"
              />
              {logSearch && (
                <button onClick={() => setLogSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#e6edf3]">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <span>총 {stats.logs_total}건</span>
              <span>|</span>
              <span>{logPage + 1} / {totalLogPages} 페이지</span>
              <button onClick={() => setLogPage(Math.max(0, logPage - 1))} disabled={logPage === 0}
                className="p-1 rounded hover:bg-[#21262d] disabled:opacity-30"><ChevronLeft size={14} /></button>
              <button onClick={() => setLogPage(Math.min(totalLogPages - 1, logPage + 1))} disabled={logPage >= totalLogPages - 1}
                className="p-1 rounded hover:bg-[#21262d] disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>

          {/* Log table */}
          <div className="rounded-xl border border-[#21262d] bg-[#161b22] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    {["", "시각", "유형", "위험도", "점수", "분석 내용", "사기 유형", "응답"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-[#8b949e] font-normal whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-[#8b949e]">로그가 없습니다.</td></tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <>
                        <tr key={log.id}
                          className={`border-b border-[#21262d]/50 hover:bg-[#21262d]/30 cursor-pointer ${log.error ? "bg-red-400/5" : ""} ${expandedLog === log.id ? "bg-[#21262d]/40" : ""}`}
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                          <td className="px-2 py-2.5 text-center">
                            <Eye size={12} className={expandedLog === log.id ? "text-[#f0a500]" : "text-[#30363d]"} />
                          </td>
                          <td className="px-3 py-2.5 text-[#8b949e] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-3 py-2.5 text-[#e6edf3]">{typeLabel[log.type] ?? log.type}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${riskBg[log.risk_level] ?? ""} ${riskColor[log.risk_level] ?? "text-[#8b949e]"}`}>
                              {riskLabel[log.risk_level] ?? log.risk_level ?? "-"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[#e6edf3] font-mono">{log.risk_score ?? "-"}</td>
                          <td className="px-3 py-2.5 text-[#e6edf3] max-w-[280px]">
                            <div className="truncate">
                              {log.type === "youtube" && log.meta_title ? (
                                <span><span className="text-red-400 mr-1">[YT]</span>{log.meta_channel ? `${log.meta_channel} / ` : ""}{log.meta_title}</span>
                              ) : log.type === "sns" && log.url_domain ? (
                                <span><span className="text-purple-400 mr-1">[SNS]</span>{log.url_domain} {log.input_preview ? `- ${log.input_preview.slice(0, 40)}` : ""}</span>
                              ) : (
                                <span>{log.input_preview ? log.input_preview.slice(0, 80) : "-"}</span>
                              )}
                            </div>
                            {log.input_length ? <div className="text-[#8b949e] text-[10px] mt-0.5">{log.input_length.toLocaleString()}자 | 신호 {log.detected_signals_count ?? 0}개</div> : null}
                          </td>
                          <td className="px-3 py-2.5 text-[#8b949e] max-w-[120px] truncate">{log.scam_type ?? "-"}</td>
                          <td className="px-3 py-2.5 text-[#8b949e] font-mono whitespace-nowrap">
                            {log.response_time_ms ? `${(log.response_time_ms / 1000).toFixed(1)}s` : "-"}
                          </td>
                        </tr>

                        {/* Expanded detail */}
                        {expandedLog === log.id && (
                          <tr key={`${log.id}-detail`} className="border-b border-[#21262d]/50">
                            <td colSpan={8} className="p-0">
                              <div className="bg-[#0d1117] p-4 space-y-4">
                                {/* Meta bar */}
                                <div className="flex flex-wrap gap-4 text-xs">
                                  <div><span className="text-[#8b949e]">ID:</span> <span className="text-[#e6edf3] font-mono text-[10px]">{log.id}</span></div>
                                  <div><span className="text-[#8b949e]">IP:</span> <span className="text-[#e6edf3] font-mono text-[10px]">{log.ip_hash ?? "-"}</span></div>
                                  {log.url_domain && <div><span className="text-[#8b949e]">도메인:</span> <span className="text-[#e6edf3]">{log.url_domain}</span></div>}
                                  {log.error && <span className="text-red-400 font-medium">에러 발생</span>}
                                </div>

                                {/* Input preview */}
                                {log.input_preview && (
                                  <div>
                                    <h4 className="text-[#8b949e] text-xs font-medium mb-1">입력 미리보기</h4>
                                    <div className="bg-[#161b22] rounded-lg p-3 text-[#e6edf3] text-xs leading-relaxed whitespace-pre-wrap break-all">
                                      {log.input_preview}
                                    </div>
                                  </div>
                                )}

                                {/* YouTube meta */}
                                {log.meta_title && (
                                  <div>
                                    <h4 className="text-[#8b949e] text-xs font-medium mb-1">YouTube 정보</h4>
                                    <div className="bg-[#161b22] rounded-lg p-3 text-xs space-y-1">
                                      <div><span className="text-[#8b949e]">제목:</span> <span className="text-[#e6edf3]">{log.meta_title}</span></div>
                                      <div><span className="text-[#8b949e]">채널:</span> <span className="text-[#e6edf3]">{log.meta_channel ?? "-"}</span></div>
                                    </div>
                                  </div>
                                )}

                                {log.ai_result && <AiResultView result={log.ai_result} onClose={() => setExpandedLog(null)} />}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom pagination */}
          {totalLogPages > 1 && (
            <div className="flex items-center justify-center gap-2 text-xs text-[#8b949e]">
              <button onClick={() => setLogPage(0)} disabled={logPage === 0}
                className="px-2 py-1 rounded border border-[#30363d] hover:bg-[#21262d] disabled:opacity-30">처음</button>
              <button onClick={() => setLogPage(Math.max(0, logPage - 1))} disabled={logPage === 0}
                className="p-1 rounded border border-[#30363d] hover:bg-[#21262d] disabled:opacity-30"><ChevronLeft size={14} /></button>
              <span className="text-[#e6edf3]">{logPage + 1}</span> / {totalLogPages}
              <button onClick={() => setLogPage(Math.min(totalLogPages - 1, logPage + 1))} disabled={logPage >= totalLogPages - 1}
                className="p-1 rounded border border-[#30363d] hover:bg-[#21262d] disabled:opacity-30"><ChevronRight size={14} /></button>
              <button onClick={() => setLogPage(totalLogPages - 1)} disabled={logPage >= totalLogPages - 1}
                className="px-2 py-1 rounded border border-[#30363d] hover:bg-[#21262d] disabled:opacity-30">끝</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
