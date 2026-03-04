"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Trash2, Clock } from "lucide-react";

interface Report {
  id: string;
  created_at: string;
  scam_type: string;
  title: string;
  description: string;
  damage: string | null;
  platform: string | null;
  operator_name: string | null;
  status: "pending" | "verified" | "rejected";
}

const statusConfig = {
  pending:  { label: "대기",  color: "text-amber-400",  bg: "bg-amber-400/10  border-amber-400/20"  },
  verified: { label: "확인됨", color: "text-green-400",  bg: "bg-green-400/10  border-green-400/20"  },
  rejected: { label: "거부됨", color: "text-[#8b949e]", bg: "bg-[#21262d]     border-[#30363d]"     },
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchReports = (status: string) => {
    setLoading(true);
    const url = status === "all" ? "/api/admin/reports" : `/api/admin/reports?status=${status}`;
    fetch(url)
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d) setReports(d.reports ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(filter); }, [filter]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchReports(filter);
  }

  async function deleteReport(id: string) {
    if (!confirm("이 제보를 삭제하시겠습니까?")) return;
    await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
    fetchReports(filter);
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-[#e6edf3] font-semibold text-lg">제보 관리</h1>
        <p className="text-[#8b949e] text-xs mt-0.5">사용자 피해 제보 목록</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "전체" },
          { key: "pending", label: "대기" },
          { key: "verified", label: "확인됨" },
          { key: "rejected", label: "거부됨" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filter === key
                ? "bg-[#f0a500]/10 text-[#f0a500] border border-[#f0a500]/20"
                : "text-[#8b949e] bg-[#161b22] border border-[#21262d] hover:text-[#e6edf3]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[#8b949e] text-sm">불러오는 중...</div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-8 text-center text-[#8b949e] text-sm">
          제보가 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => {
            const sc = statusConfig[r.status];
            const isOpen = expanded === r.id;
            return (
              <div
                key={r.id}
                className="rounded-xl border border-[#21262d] bg-[#161b22] overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#21262d]/30"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  <span className={`shrink-0 px-2 py-0.5 rounded border text-[10px] font-medium ${sc.bg} ${sc.color}`}>
                    {sc.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#e6edf3] text-sm truncate">{r.title}</div>
                    <div className="text-[#8b949e] text-xs mt-0.5">
                      {r.scam_type} · {new Date(r.created_at).toLocaleDateString("ko-KR")}
                      {r.operator_name && ` · ${r.operator_name}`}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {r.status !== "verified" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateStatus(r.id, "verified"); }}
                        className="p-1.5 rounded-lg text-[#8b949e] hover:text-green-400 hover:bg-green-400/10 transition-colors"
                        title="확인됨"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    {r.status !== "rejected" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateStatus(r.id, "rejected"); }}
                        className="p-1.5 rounded-lg text-[#8b949e] hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                        title="거부됨"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteReport(r.id); }}
                      className="p-1.5 rounded-lg text-[#8b949e] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-[#21262d] pt-3 space-y-2">
                    <p className="text-[#8b949e] text-xs leading-relaxed">{r.description}</p>
                    {(r.damage || r.platform) && (
                      <div className="flex gap-4 text-xs text-[#8b949e]">
                        {r.damage && <span>피해금액: <span className="text-[#e6edf3]">{r.damage}</span></span>}
                        {r.platform && <span>플랫폼: <span className="text-[#e6edf3]">{r.platform}</span></span>}
                      </div>
                    )}
                    {r.status === "pending" && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => updateStatus(r.id, "verified")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-400/10 border border-green-400/20 text-green-400 text-xs hover:bg-green-400/20 transition-colors"
                        >
                          <CheckCircle size={12} /> 확인됨으로 처리
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, "rejected")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] border border-[#30363d] text-[#8b949e] text-xs hover:text-[#e6edf3] transition-colors"
                        >
                          <Clock size={12} /> 거부
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
