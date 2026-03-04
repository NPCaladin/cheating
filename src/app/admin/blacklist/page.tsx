"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";

interface BlacklistItem {
  id: string;
  created_at: string;
  entity_type: string;
  entity_name: string;
  scam_type: string | null;
  report_count: number;
  verified: boolean;
  severity: "low" | "medium" | "high";
  notes: string | null;
}

const severityConfig = {
  low:    { label: "낮음",   color: "text-blue-400",   bg: "bg-blue-400/10  border-blue-400/20"  },
  medium: { label: "보통",   color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/20" },
  high:   { label: "높음",   color: "text-red-400",    bg: "bg-red-400/10   border-red-400/20"   },
};

const entityTypes = ["service", "channel", "person"] as const;
const entityTypeLabel: Record<string, string> = {
  service: "서비스", channel: "채널", person: "인물",
};

const scamTypeOptions = [
  "주식 리딩방", "코인/가상화폐 리딩방", "FX마진/해외선물", "AI 자동매매",
  "성공팔이", "온라인 부업 강의", "코딩/부트캠프", "민간자격증", "보상형 플랫폼",
  "팀미션/SNS 부업", "스마트스토어", "해외구매대행", "기획부동산", "다단계", "로또/도박",
];

export default function AdminBlacklistPage() {
  const router = useRouter();
  const [items, setItems] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    entity_name: "",
    entity_type: "service",
    scam_type: "",
    severity: "medium",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchList = () => {
    fetch("/api/admin/blacklist")
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        return r.json();
      })
      .then((d) => { if (d) setItems(d.blacklist ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "등록 실패"); return; }
      setForm({ entity_name: "", entity_type: "service", scam_type: "", severity: "medium", notes: "" });
      setShowForm(false);
      fetchList();
    } catch {
      setFormError("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVerified(item: BlacklistItem) {
    await fetch(`/api/admin/blacklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: !item.verified }),
    });
    fetchList();
  }

  async function deleteItem(id: string, name: string) {
    if (!confirm(`"${name}"을(를) 블랙리스트에서 삭제하시겠습니까?`)) return;
    await fetch(`/api/admin/blacklist/${id}`, { method: "DELETE" });
    fetchList();
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[#e6edf3] font-semibold text-lg">블랙리스트</h1>
          <p className="text-[#8b949e] text-xs mt-0.5">신고된 사기 운영자·채널·서비스</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f0a500] text-[#0d1117] text-xs font-semibold hover:bg-[#f0a500]/90 transition-all"
        >
          <Plus size={13} /> 항목 추가
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="rounded-xl border border-[#f0a500]/20 bg-[#161b22] p-5 space-y-3">
          <h2 className="text-[#e6edf3] text-sm font-medium">새 블랙리스트 항목</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="운영자/채널/서비스명 *"
              value={form.entity_name}
              onChange={(e) => setForm({ ...form, entity_name: e.target.value })}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] text-xs placeholder:text-[#8b949e] focus:outline-none focus:border-[#f0a500]/50"
              required
            />
            <select
              value={form.entity_type}
              onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] text-xs focus:outline-none focus:border-[#f0a500]/50"
            >
              {entityTypes.map((t) => (
                <option key={t} value={t}>{entityTypeLabel[t]}</option>
              ))}
            </select>
            <select
              value={form.scam_type}
              onChange={(e) => setForm({ ...form, scam_type: e.target.value })}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] text-xs focus:outline-none focus:border-[#f0a500]/50"
            >
              <option value="">사기 유형 선택</option>
              {scamTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] text-xs focus:outline-none focus:border-[#f0a500]/50"
            >
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
            </select>
          </div>
          <textarea
            placeholder="메모 (선택)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-[#e6edf3] text-xs placeholder:text-[#8b949e] focus:outline-none focus:border-[#f0a500]/50 resize-none"
          />
          {formError && <p className="text-red-400 text-xs">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#f0a500] text-[#0d1117] font-semibold text-xs hover:bg-[#f0a500]/90 disabled:opacity-50"
            >
              {submitting ? "등록 중..." : "등록"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(""); }}
              className="px-4 py-2 rounded-lg bg-[#21262d] text-[#8b949e] text-xs hover:text-[#e6edf3]"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-[#8b949e] text-sm">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-8 text-center text-[#8b949e] text-sm">
          블랙리스트가 비어 있습니다.
        </div>
      ) : (
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#21262d]">
                {["이름", "유형", "사기 유형", "신고", "위험도", "확인", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[#8b949e] font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const sc = severityConfig[item.severity];
                return (
                  <tr key={item.id} className="border-b border-[#21262d]/50 hover:bg-[#21262d]/30">
                    <td className="px-4 py-2.5">
                      <div className="text-[#e6edf3] font-medium">{item.entity_name}</div>
                      {item.notes && (
                        <div className="text-[#8b949e] text-[10px] mt-0.5 truncate max-w-[160px]">{item.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[#8b949e]">
                      {entityTypeLabel[item.entity_type] ?? item.entity_type}
                    </td>
                    <td className="px-4 py-2.5 text-[#8b949e] max-w-[140px] truncate">
                      {item.scam_type ?? "-"}
                    </td>
                    <td className="px-4 py-2.5 text-[#e6edf3] font-mono">
                      {item.report_count}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => toggleVerified(item)}
                        className={`transition-colors ${item.verified ? "text-green-400" : "text-[#8b949e] hover:text-green-400"}`}
                        title={item.verified ? "확인됨" : "미확인"}
                      >
                        {item.verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deleteItem(item.id, item.entity_name)}
                        className="text-[#8b949e] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
