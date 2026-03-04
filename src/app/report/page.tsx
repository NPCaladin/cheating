"use client";

import { useState } from "react";
import { FileText, AlertTriangle, Send, CheckCircle, Shield, Phone, ExternalLink } from "lucide-react";

const scamTypeOptions = [
  "주식 리딩방/유료 종목 추천",
  "코인/가상화폐 리딩방",
  "FX마진/해외선물 리딩방",
  "AI 자동매매 투자 사기",
  "성공팔이 (자기계발 강연)",
  "고액 온라인 부업 강의",
  "코딩/부트캠프 교육 사기",
  "민간자격증 사기",
  "보상형 플랫폼 먹튀",
  "팀미션/SNS 부업 사기",
  "스마트스토어/쇼핑몰 사기",
  "해외구매대행/아마존 셀러 사기",
  "부동산 강연/기획부동산 사기",
  "다단계/네트워크마케팅",
  "로또/도박/스포츠토토 사기",
  "기타",
];

const urgentReports = [
  { name: "경찰청 사이버수사대", tel: "182", desc: "즉각적인 범죄 수사", href: "https://ecrm.police.go.kr" },
  { name: "금융감독원", tel: "1332", desc: "투자·금융 사기", href: "https://www.fss.or.kr" },
  { name: "한국소비자원", tel: "1372", desc: "교육·강의 피해 상담", href: "https://www.kca.go.kr" },
  { name: "공정거래위원회", tel: "1372", desc: "다단계·불공정거래", href: "https://www.ftc.go.kr" },
];

interface FormData {
  scamType: string;
  title: string;
  description: string;
  damage: string;
  platform: string;
  operatorName: string;
  anonymous: boolean;
  contactEmail: string;
}

const initialForm: FormData = {
  scamType: "",
  title: "",
  description: "",
  damage: "",
  platform: "",
  operatorName: "",
  anonymous: true,
  contactEmail: "",
};

export default function ReportPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scamType: form.scamType,
          title: form.title,
          description: form.description,
          damage: form.damage || undefined,
          platform: form.platform || undefined,
          operatorName: form.operatorName || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "제보 접수 중 오류가 발생했습니다.");
        return;
      }
      setSubmitted(true);
    } catch {
      alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.scamType && form.title && form.description.length >= 50;

  if (submitted) {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-10 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-400/10 border border-green-400/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-[#e6edf3] mb-3">제보가 접수되었습니다</h2>
          <p className="text-[#8b949e] text-sm leading-relaxed mb-8">
            소중한 제보 감사합니다. 제보하신 내용은 다른 피해자를 예방하는 데 사용됩니다.
            {!form.anonymous && form.contactEmail && " 검토 후 이메일로 연락드리겠습니다."}
          </p>
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-left mb-6">
            <p className="text-amber-400 text-xs font-medium mb-1">실제 사기 피해라면</p>
            <p className="text-[#8b949e] text-xs">
              경찰청 사이버수사대(182) 또는 금융감독원(1332)에 즉시 신고하세요.
              공식 신고만이 법적 구제를 받을 수 있는 방법입니다.
            </p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setForm(initialForm); }}
            className="px-5 py-2.5 rounded-xl bg-[#21262d] border border-[#30363d] text-[#e6edf3] text-sm font-medium hover:bg-[#30363d] transition-colors"
          >
            새 제보 작성하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#e6edf3] mb-2">
            피해 사례 제보
          </h1>
          <p className="text-[#8b949e] text-sm">
            경험하신 사기 피해를 제보해 주세요. 다른 피해자를 막는 데 큰 도움이 됩니다.
          </p>
        </div>

        {/* Urgent report banner */}
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-400" />
            <h2 className="font-semibold text-red-400 text-sm">지금 진행 중인 사기라면 즉시 신고하세요</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {urgentReports.map((org) => (
              <a
                key={org.name}
                href={org.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#e6edf3] text-xs font-medium">{org.name}</span>
                    <ExternalLink size={10} className="text-[#8b949e] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold text-sm font-mono">{org.tel}</span>
                    <span className="text-[#8b949e] text-xs">{org.desc}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Anonymity toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-[#30363d] bg-[#161b22]">
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-green-400" />
              <div>
                <p className="text-[#e6edf3] text-sm font-medium">익명 제보</p>
                <p className="text-[#8b949e] text-xs">개인 정보를 수집하지 않습니다</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleChange("anonymous", !form.anonymous)}
              className={`w-10 h-6 rounded-full transition-colors relative ${form.anonymous ? "bg-green-400" : "bg-[#30363d]"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.anonymous ? "left-4" : "left-0.5"}`} />
            </button>
          </div>

          {/* Contact email (optional, shown when not anonymous) */}
          {!form.anonymous && (
            <div>
              <label className="block text-[#8b949e] text-xs font-medium mb-1.5">연락처 이메일 (선택)</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="검토 결과를 받을 이메일 (선택사항)"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50"
              />
            </div>
          )}

          {/* Scam type */}
          <div>
            <label className="block text-[#8b949e] text-xs font-medium mb-1.5">
              사기 유형 <span className="text-red-400">*</span>
            </label>
            <select
              value={form.scamType}
              onChange={(e) => handleChange("scamType", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-sm focus:outline-none focus:border-[#f0a500]/50 appearance-none"
              required
            >
              <option value="">유형을 선택하세요</option>
              {scamTypeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[#8b949e] text-xs font-medium mb-1.5">
              제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="예: 'OO 마케팅 강의' 사기 피해"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50"
              required
              maxLength={100}
            />
          </div>

          {/* Operator name */}
          <div>
            <label className="block text-[#8b949e] text-xs font-medium mb-1.5">
              사기 운영자/서비스명 (선택)
            </label>
            <input
              type="text"
              value={form.operatorName}
              onChange={(e) => handleChange("operatorName", e.target.value)}
              placeholder="강사명, 채널명, 서비스명 등"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50"
              maxLength={100}
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-[#8b949e] text-xs font-medium mb-1.5">
              유통 채널/플랫폼 (선택)
            </label>
            <input
              type="text"
              value={form.platform}
              onChange={(e) => handleChange("platform", e.target.value)}
              placeholder="예: 유튜브, 텔레그램, 카카오톡, 인스타그램"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50"
              maxLength={100}
            />
          </div>

          {/* Damage */}
          <div>
            <label className="block text-[#8b949e] text-xs font-medium mb-1.5">
              피해 금액 (선택)
            </label>
            <input
              type="text"
              value={form.damage}
              onChange={(e) => handleChange("damage", e.target.value)}
              placeholder="예: 300만원, 1,200만원"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#8b949e] text-xs font-medium mb-1.5">
              피해 내용 <span className="text-red-400">*</span>
              <span className="text-[#8b949e] ml-1">(최소 50자)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="어떤 광고/문구에 유혹됐는지, 실제로 어떤 피해를 입었는지, 사기를 알아챈 계기 등을 자세히 작성해주세요. 다른 피해자를 막는 데 큰 도움이 됩니다."
              className="w-full h-36 px-4 py-3 rounded-xl bg-[#0d1117] border border-[#30363d] text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50 resize-none"
              required
              minLength={50}
              maxLength={3000}
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${form.description.length < 50 ? "text-amber-400" : "text-green-400"}`}>
                {form.description.length}/3000 {form.description.length < 50 && `(${50 - form.description.length}자 더 필요)`}
              </span>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="rounded-xl border border-[#21262d] bg-[#161b22]/50 p-4 flex gap-2">
            <FileText size={13} className="text-[#8b949e] shrink-0 mt-0.5" />
            <p className="text-[#8b949e] text-xs leading-relaxed">
              제보하신 내용은 사기 유형 데이터베이스 구축에 활용됩니다. 개인 식별 정보는 수집되지 않으며,
              제보 내용은 검토 후 익명으로 공개될 수 있습니다. 허위 제보는 명예훼손에 해당할 수 있습니다.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#f0a500] text-[#0d1117] font-semibold text-sm hover:bg-[#f0a500]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0d1117]/30 border-t-[#0d1117] rounded-full animate-spin" />
                제보 접수 중...
              </>
            ) : (
              <>
                <Send size={15} />
                피해 사례 제보하기
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
