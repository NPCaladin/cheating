"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, AlertTriangle, FileText, Activity } from "lucide-react";

interface DailyStats {
  date: string;
  count: number;
  high_count: number;
}

interface ScamType {
  scam_type: string;
  count: number;
}

interface RecentLog {
  id: string;
  created_at: string;
  type: string;
  risk_level: string;
  risk_score: number;
  scam_type: string | null;
}

interface Stats {
  today: { total: number; high: number };
  total: { total: number; high: number };
  pending_reports: number;
  daily_stats: DailyStats[];
  scam_types: ScamType[];
  recent_logs: RecentLog[];
}

const riskColor: Record<string, string> = {
  safe:     "text-green-400",
  low:      "text-blue-400",
  medium:   "text-amber-400",
  high:     "text-orange-400",
  critical: "text-red-400",
};

const riskBg: Record<string, string> = {
  safe:     "bg-green-400/10 border-green-400/20",
  low:      "bg-blue-400/10 border-blue-400/20",
  medium:   "bg-amber-400/10 border-amber-400/20",
  high:     "bg-orange-400/10 border-orange-400/20",
  critical: "bg-red-400/10 border-red-400/20",
};

const riskLabel: Record<string, string> = {
  safe: "안전", low: "낮음", medium: "주의", high: "위험", critical: "극위험",
};

const typeLabel: Record<string, string> = {
  text: "텍스트", youtube: "유튜브", sns: "SNS",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d) setStats(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
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
    ? Math.round((stats.total.high / stats.total.total) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[#e6edf3] font-semibold text-lg">대시보드</h1>
        <p className="text-[#8b949e] text-xs mt-0.5">{new Date().toLocaleDateString("ko-KR")} 기준</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "오늘 분석",
            value: stats.today.total,
            sub: `위험 ${stats.today.high}건`,
            icon: Activity,
            color: "text-blue-400",
            bg: "bg-blue-400/5 border-blue-400/20",
          },
          {
            label: "누적 분석",
            value: stats.total.total,
            sub: `위험 ${stats.total.high}건`,
            icon: TrendingUp,
            color: "text-[#f0a500]",
            bg: "bg-[#f0a500]/5 border-[#f0a500]/20",
          },
          {
            label: "위험 감지율",
            value: `${highRate}%`,
            sub: "high + critical",
            icon: AlertTriangle,
            color: "text-red-400",
            bg: "bg-red-400/5 border-red-400/20",
          },
          {
            label: "미처리 제보",
            value: stats.pending_reports,
            sub: "처리 필요",
            icon: FileText,
            color: "text-amber-400",
            bg: "bg-amber-400/5 border-amber-400/20",
          },
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
        {/* 7-day bar chart */}
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
          <h2 className="text-[#e6edf3] text-sm font-medium mb-4">최근 7일 분석 추이</h2>
          <div className="flex items-end gap-2 h-32">
            {stats.daily_stats.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: "96px" }}>
                  {/* high portion */}
                  <div
                    className="w-full bg-red-400/40 rounded-sm"
                    style={{ height: `${Math.round((d.high_count / maxDaily) * 96)}px` }}
                  />
                  {/* normal portion */}
                  <div
                    className="w-full bg-[#f0a500]/40 rounded-sm"
                    style={{ height: `${Math.round(((d.count - d.high_count) / maxDaily) * 96)}px` }}
                  />
                </div>
                <span className="text-[#8b949e] text-[10px]">
                  {d.date.slice(5).replace("-", "/")}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f0a500]/40" />일반
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-400/40" />위험
            </div>
          </div>
        </div>

        {/* Scam type top 5 */}
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-5">
          <h2 className="text-[#e6edf3] text-sm font-medium mb-4">사기 유형 Top 5 (7일)</h2>
          {stats.scam_types.length === 0 ? (
            <p className="text-[#8b949e] text-xs">데이터가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {stats.scam_types.map(({ scam_type, count }) => (
                <div key={scam_type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#e6edf3] truncate max-w-[70%]">{scam_type}</span>
                    <span className="text-[#8b949e]">{count}건</span>
                  </div>
                  <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f0a500]/60 rounded-full"
                      style={{ width: `${Math.round((count / maxType) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent logs */}
      <div className="rounded-xl border border-[#21262d] bg-[#161b22] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#21262d]">
          <h2 className="text-[#e6edf3] text-sm font-medium">최근 분석 로그</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#21262d]">
                {["시각", "유형", "위험도", "점수", "사기 유형"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[#8b949e] font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recent_logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#8b949e]">
                    로그가 없습니다.
                  </td>
                </tr>
              ) : (
                stats.recent_logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#21262d]/50 hover:bg-[#21262d]/30">
                    <td className="px-4 py-2.5 text-[#8b949e]">
                      {new Date(log.created_at).toLocaleString("ko-KR", {
                        month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-[#e6edf3]">
                      {typeLabel[log.type] ?? log.type}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${riskBg[log.risk_level] ?? ""} ${riskColor[log.risk_level] ?? "text-[#8b949e]"}`}>
                        {riskLabel[log.risk_level] ?? log.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#e6edf3] font-mono">
                      {log.risk_score ?? "-"}
                    </td>
                    <td className="px-4 py-2.5 text-[#8b949e] max-w-[200px] truncate">
                      {log.scam_type ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
