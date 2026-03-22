"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search, AlertTriangle, ShieldCheck, Shield, ShieldAlert,
  Zap, ChevronDown, ChevronUp, ExternalLink, Youtube, Instagram,
  FileText, Link2, Scale, Brain, ListChecks, Phone, Target,
  CheckCircle2, Circle, ArrowRight, Quote, Clock, Loader2
} from "lucide-react";

type InputMode = "text" | "youtube" | "sns";

interface DetectionResult {
  riskScore: number;
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  verdict: string;
  summary: string;
  matchedScamTypes: Array<{
    type: string;
    similarity: "high" | "medium" | "low";
    reason: string;
  }>;
  detectedSignals: Array<{
    signal: string;
    evidence: string;
    severity: "critical" | "high" | "medium" | "low";
    explanation?: string;
  }>;
  safeAspects: string[];
  recommendation: string;
  reportTo: string[];
  legalAnalysis?: {
    violationRisk: "high" | "medium" | "low" | "none";
    applicableLaws: string[];
    explanation: string;
  };
  psychologyTactics?: Array<{
    tactic: string;
    description: string;
    evidence: string;
  }>;
  verificationChecklist?: Array<{
    item: string;
    method: string;
    priority: "high" | "medium" | "low";
  }>;
  reportingGuide?: {
    primaryAgency: string;
    phone: string;
    website: string;
    steps: string[];
  };
  analysisConfidence?: "high" | "medium" | "low";
  confidenceReason?: string;
  transcriptAnalysis?: Array<{
    quote: string;
    timestamp: string;
    issue: string;
    scamPattern: string;
    severity: "critical" | "high" | "medium" | "low";
  }>;
  meta?: {
    type: "youtube" | "sns";
    title?: string;
    channelName?: string;
    thumbnail?: string;
    hasTranscript?: boolean;
    videoId?: string;
    url?: string;
  };
}

const EXAMPLE_TEXTS = [
  { label: "주식 리딩방", text: "VIP 회원 전용 종목 선공개! 이번 주 급등 예정 종목 5개를 미리 알려드립니다. 원금 보장에 월 30% 수익률 달성! 지금 입장하면 첫 달 무료. 선착순 10명만 받습니다." },
  { label: "성공팔이 강연", text: "저도 처음엔 빈손이었습니다. 하지만 이 하나의 방법으로 월 1억 자동수익 시스템을 만들었어요. 경제적 자유를 원하신다면 지금 신청하세요. 오늘 자정까지 얼리버드 할인 70%." },
  { label: "코인 사기", text: "AI 자동매매 코인 시스템 연 600% 수익! 스테이킹으로 매달 50% 이자 지급. 상장 직전 코인 선점 기회. 내부자 정보로 VIP 회원만 공개." },
];

const riskConfig = {
  safe:     { color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30",  icon: ShieldCheck,   barColor: "bg-green-400" },
  low:      { color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30",   icon: Shield,        barColor: "bg-blue-400" },
  medium:   { color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/30",  icon: ShieldAlert,   barColor: "bg-amber-400" },
  high:     { color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", icon: AlertTriangle, barColor: "bg-orange-400" },
  critical: { color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    icon: AlertTriangle, barColor: "bg-red-400" },
};

const severityColors = {
  critical: "text-red-400 bg-red-400/10 border-red-400/30",
  high:     "text-orange-400 bg-orange-400/10 border-orange-400/30",
  medium:   "text-amber-400 bg-amber-400/10 border-amber-400/30",
  low:      "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

const similarityColors = { high: "text-red-400", medium: "text-amber-400", low: "text-blue-400" };

const legalRiskColors = {
  high: "text-red-400 bg-red-400/10 border-red-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  low: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  none: "text-green-400 bg-green-400/10 border-green-400/30",
};

const confidenceConfig = {
  high: { color: "text-green-400", label: "높음", desc: "충분한 정보를 바탕으로 신뢰도 높은 분석" },
  medium: { color: "text-amber-400", label: "중간", desc: "일부 정보가 부족하여 추가 확인 권장" },
  low: { color: "text-[#8b949e]", label: "낮음", desc: "정보 부족으로 인한 제한적 분석" },
};

const priorityConfig = {
  high: { color: "text-red-400", label: "필수" },
  medium: { color: "text-amber-400", label: "권장" },
  low: { color: "text-blue-400", label: "참고" },
};

const tabs: { id: InputMode; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "text",    label: "텍스트",   icon: FileText,   desc: "광고 문구, 강의 소개, 카톡 메시지 등 텍스트를 직접 붙여넣기" },
  { id: "youtube", label: "YouTube", icon: Youtube,    desc: "YouTube 또는 Shorts URL을 붙여넣으면 제목·채널·자막 자동 분석" },
  { id: "sns",     label: "SNS/기타", icon: Instagram,  desc: "인스타그램, 틱톡 등 SNS URL + 게시글 캡션 붙여넣기" },
];

const ANALYSIS_STAGES = [
  { message: "URL 정보 수집 중...", duration: 2000 },
  { message: "자막 데이터 추출 중...", duration: 2000 },
  { message: "사기 유형 DB(207개 패턴) 매칭 중...", duration: 3000 },
  { message: "금융감독원 블랙리스트 대조 중...", duration: 3000 },
  { message: "법적 판례 및 관련 법규 분석 중...", duration: 4000 },
  { message: "심리 조작 기법 패턴 분석 중...", duration: 4000 },
  { message: "전문가 수준 종합 리포트 생성 중...", duration: 4000 },
  { message: "최종 검증 및 신뢰도 평가 중...", duration: 999999 },
];

const severityLabels = {
  critical: "즉시 확인",
  high: "높은 위험",
  medium: "주의",
  low: "참고",
};

function SectionHeader({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={13} className="text-[#8b949e]" />
      <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">{title}</h3>
      {badge && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">{badge}</span>
      )}
    </div>
  );
}

function ResultPanel({ result }: { result: DetectionResult }) {
  const [showDetails, setShowDetails] = useState(true);
  const config = riskConfig[result.riskLevel];
  const RiskIcon = config.icon;

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} overflow-hidden`}>
      {/* YouTube 썸네일 미리보기 */}
      {result.meta?.type === "youtube" && result.meta.thumbnail && (
        <div className="relative">
          <img src={result.meta.thumbnail} alt={result.meta.title} className="w-full h-40 object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-[#e6edf3] text-sm font-medium line-clamp-1">{result.meta.title}</p>
            <p className="text-[#8b949e] text-xs">{result.meta.channelName}</p>
            {result.meta.hasTranscript !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${result.meta.hasTranscript ? "bg-green-400/20 text-green-400" : "bg-[#30363d] text-[#8b949e]"}`}>
                {result.meta.hasTranscript ? "자막 분석 완료" : "자막 없음 (제목/채널만 분석)"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Report header */}
      <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">AI 전문가 분석 리포트</h2>
          <span className="text-[10px] text-[#8b949e]/60 font-mono">
            {new Date().toLocaleDateString("ko-KR")} {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} | v2.0
          </span>
        </div>
        <div className="h-px bg-gradient-to-r from-[#f0a500]/40 via-[#30363d] to-transparent mb-0" />
      </div>

      {/* Score header */}
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.bg} border ${config.border} shrink-0`}>
            <RiskIcon size={24} className={config.color} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-2xl font-bold ${config.color}`}>{result.verdict}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${config.border} ${config.color}`}>
                위험도 {result.riskScore}/100
              </span>
            </div>
            <p className="text-[#e6edf3] text-sm leading-relaxed">{result.summary}</p>
          </div>
        </div>

        {/* Risk bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-[#8b949e] mb-1.5">
            <span>안전</span><span>즉시 확인 필요</span>
          </div>
          <div className="h-2.5 bg-[#0d1117] rounded-full overflow-hidden">
            <div className={`h-full ${config.barColor} rounded-full transition-all duration-700`} style={{ width: `${result.riskScore}%` }} />
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 rounded-xl bg-[#0d1117]/60 border border-[#21262d]">
          <p className="text-xs text-[#8b949e] font-medium mb-1.5">권고사항</p>
          <p className="text-[#e6edf3] text-sm leading-relaxed">{result.recommendation}</p>
        </div>

        {/* Report To */}
        {result.reportTo.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {result.reportTo.map((org) => (
              <span key={org} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 text-xs">
                <ExternalLink size={10} />{org}
              </span>
            ))}
          </div>
        )}

        {/* Analysis Confidence indicator */}
        {result.analysisConfidence && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[#8b949e]">
            <Target size={11} />
            <span>분석 신뢰도: </span>
            <span className={`font-medium ${confidenceConfig[result.analysisConfidence].color}`}>
              {confidenceConfig[result.analysisConfidence].label}
            </span>
            {result.confidenceReason && (
              <span className="text-[#8b949e]/70">— {result.confidenceReason}</span>
            )}
          </div>
        )}
      </div>

      {/* Details toggle */}
      <div className="border-t border-[#30363d]/50">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between px-6 py-3 text-[#8b949e] text-xs hover:text-[#e6edf3] transition-colors"
        >
          <span className="font-medium">상세 분석 결과 보기</span>
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDetails && (
          <div className="px-6 pb-8 space-y-7">

            {/* Legal Analysis */}
            {result.legalAnalysis && (
              <div>
                <SectionHeader icon={Scale} title="법적 분석" />
                <div className="space-y-3">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${legalRiskColors[result.legalAnalysis.violationRisk]}`}>
                    {result.legalAnalysis.violationRisk === "high" ? "법적 위반 위험 높음" :
                     result.legalAnalysis.violationRisk === "medium" ? "법적 위반 가능성 있음" :
                     result.legalAnalysis.violationRisk === "low" ? "경미한 위반 가능성" : "명확한 위반 없음"}
                  </div>
                  <p className="text-[#e6edf3] text-sm leading-relaxed">{result.legalAnalysis.explanation}</p>
                  {result.legalAnalysis.applicableLaws.length > 0 && (
                    <div className="space-y-2">
                      {result.legalAnalysis.applicableLaws.map((law, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                          <span className="text-[#f0a500] text-xs mt-0.5 shrink-0">§</span>
                          <p className="text-[#8b949e] text-xs leading-relaxed">{law}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transcript Analysis */}
            {result.transcriptAnalysis && result.transcriptAnalysis.length > 0 && (
              <div>
                <SectionHeader icon={Quote} title="자막 원문 인용 분석" badge={`${result.transcriptAnalysis.length}건`} />
                <div className="space-y-3">
                  {result.transcriptAnalysis.map((item, i) => (
                    <div key={i} className={`rounded-xl border overflow-hidden ${severityColors[item.severity]}`}>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded border border-current/30 font-medium ${severityColors[item.severity].split(" ")[0]}`}>
                            {severityLabels[item.severity]}
                          </span>
                          <span className="text-[#8b949e] text-xs flex items-center gap-1">
                            <Clock size={10} />
                            {item.timestamp}
                          </span>
                        </div>
                        <blockquote className="border-l-2 border-[#f0a500]/50 pl-3 py-1 mb-3">
                          <p className="text-[#e6edf3] text-sm font-medium italic leading-relaxed">"{item.quote}"</p>
                        </blockquote>
                        <p className="text-[#8b949e] text-xs leading-relaxed mb-2">{item.issue}</p>
                        <div className="flex items-center gap-1.5">
                          <Target size={10} className="text-[#f0a500]" />
                          <span className="text-[#f0a500] text-xs font-medium">{item.scamPattern}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Signals */}
            {result.detectedSignals.length > 0 && (
              <div>
                <SectionHeader icon={AlertTriangle} title="감지된 위험 신호" badge={`${result.detectedSignals.length}개`} />
                <div className="space-y-2.5">
                  {result.detectedSignals.map((signal, i) => (
                    <div key={i} className={`p-3.5 rounded-xl border ${severityColors[signal.severity]}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-xs">{signal.signal}</span>
                        <span className="text-xs opacity-60 border border-current/30 rounded px-1.5 py-0.5">
                          {signal.severity === "critical" ? "즉시 확인" : signal.severity === "high" ? "높은 주의" : signal.severity === "medium" ? "주의" : "참고"}
                        </span>
                      </div>
                      <p className="text-xs font-mono bg-black/20 rounded px-2 py-1 mb-2 leading-relaxed">"{signal.evidence}"</p>
                      {signal.explanation && (
                        <p className="text-xs opacity-80 leading-relaxed">{signal.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Psychology Tactics */}
            {result.psychologyTactics && result.psychologyTactics.length > 0 && (
              <div>
                <SectionHeader icon={Brain} title="심리 조작 기법 분석" badge={`${result.psychologyTactics.length}개`} />
                <div className="space-y-2.5">
                  {result.psychologyTactics.map((tactic, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#0d1117] border border-purple-500/20">
                      <p className="text-purple-300 text-xs font-semibold mb-1.5">{tactic.tactic}</p>
                      <p className="text-[#e6edf3] text-xs leading-relaxed mb-2">{tactic.description}</p>
                      <div className="flex items-start gap-1.5">
                        <ArrowRight size={10} className="text-[#8b949e] mt-0.5 shrink-0" />
                        <p className="text-[#8b949e] text-xs italic">증거: "{tactic.evidence}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Checklist */}
            {result.verificationChecklist && result.verificationChecklist.length > 0 && (
              <div>
                <SectionHeader icon={ListChecks} title="검증 체크리스트" />
                <div className="space-y-2">
                  {result.verificationChecklist.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d]">
                      <div className="shrink-0 mt-0.5">
                        <Circle size={14} className="text-[#30363d]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[#e6edf3] text-xs font-medium">{item.item}</span>
                          <span className={`text-xs font-medium ${priorityConfig[item.priority].color}`}>
                            [{priorityConfig[item.priority].label}]
                          </span>
                        </div>
                        <p className="text-[#8b949e] text-xs leading-relaxed">{item.method}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reporting Guide */}
            {result.reportingGuide && (
              <div>
                <SectionHeader icon={Phone} title="신고 가이드" />
                <div className="rounded-xl bg-[#0d1117] border border-[#21262d] overflow-hidden">
                  <div className="flex items-center gap-3 p-4 border-b border-[#21262d]">
                    <div className="w-9 h-9 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center shrink-0">
                      <Phone size={14} className="text-red-400" />
                    </div>
                    <div>
                      <p className="text-[#e6edf3] text-sm font-semibold">{result.reportingGuide.primaryAgency}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-red-400 text-xs font-mono font-bold">{result.reportingGuide.phone}</span>
                        {result.reportingGuide.website && (
                          <a
                            href={result.reportingGuide.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8b949e] text-xs hover:text-[#e6edf3] inline-flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink size={10} />
                            공식 사이트
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {result.reportingGuide.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 size={13} className="text-green-400 shrink-0 mt-0.5" />
                        <p className="text-[#8b949e] text-xs leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Matched Scam Types */}
            {result.matchedScamTypes.length > 0 && (
              <div>
                <SectionHeader icon={ShieldAlert} title="유사 사기 유형" />
                <div className="space-y-2.5">
                  {result.matchedScamTypes.map((scam, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[#e6edf3] text-xs font-semibold">{scam.type}</span>
                        <span className={`text-xs font-medium ${similarityColors[scam.similarity]}`}>
                          유사도 {scam.similarity === "high" ? "높음" : scam.similarity === "medium" ? "중간" : "낮음"}
                        </span>
                      </div>
                      <p className="text-[#8b949e] text-xs leading-relaxed">{scam.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Safe Aspects */}
            {result.safeAspects.length > 0 && (
              <div>
                <SectionHeader icon={ShieldCheck} title="안전 요소" />
                <div className="space-y-2">
                  {result.safeAspects.map((aspect, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-green-400/5 border border-green-400/20">
                      <CheckCircle2 size={13} className="text-green-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-[#e6edf3] leading-relaxed">{aspect}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default function DetectorPage() {
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [extraText, setExtraText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState("");
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loading) {
      setAnalysisStage(0);
      let currentStage = 0;
      const advanceStage = () => {
        if (currentStage < ANALYSIS_STAGES.length - 1) {
          currentStage++;
          setAnalysisStage(currentStage);
          stageTimerRef.current = setTimeout(advanceStage, ANALYSIS_STAGES[currentStage].duration);
        }
      };
      stageTimerRef.current = setTimeout(advanceStage, ANALYSIS_STAGES[0].duration);
      return () => { if (stageTimerRef.current) clearTimeout(stageTimerRef.current); };
    } else {
      setAnalysisStage(0);
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    }
  }, [loading]);

  const reset = () => { setResult(null); setError(""); };

  const analyzeText = async () => {
    if (!text.trim()) return;
    setLoading(true); reset();
    try {
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "분석 중 오류가 발생했습니다."); return; }
      setResult(data);
    } catch { setError("네트워크 오류가 발생했습니다."); }
    finally { setLoading(false); }
  };

  const analyzeUrl = async () => {
    if (!url.trim()) return;
    setLoading(true); reset();
    try {
      const res = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, extraText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "분석 중 오류가 발생했습니다."); return; }
      setResult(data);
    } catch { setError("네트워크 오류가 발생했습니다."); }
    finally { setLoading(false); }
  };

  const canSubmit = mode === "text" ? !!text.trim() : !!url.trim();

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0a500]/10 border border-[#f0a500]/20 text-[#f0a500] text-xs font-medium mb-4">
            <Zap size={11} />
            AI POWERED DETECTOR
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#e6edf3] mb-2">사기 판별기</h1>
          <p className="text-[#8b949e] text-sm">
            텍스트, YouTube 링크, SNS 게시글을 AI가 즉시 분석합니다.
            한국 법령 위반, 심리 조작 기법, 검증 체크리스트까지 상세 제공.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-[#161b22] border border-[#30363d] mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setMode(tab.id); reset(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  mode === tab.id
                    ? "bg-[#f0a500] text-[#0d1117]"
                    : "text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab description */}
        <p className="text-[#8b949e] text-xs mb-4 px-1">
          {tabs.find((t) => t.id === mode)?.desc}
        </p>

        {/* Input area */}
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4 sm:p-6 mb-4">

          {/* TEXT MODE */}
          {mode === "text" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[#8b949e] text-xs font-medium">분석할 텍스트</label>
                <span className="text-[#8b949e] text-xs font-mono">{text.length}/5000</span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="광고 문구, 강의 소개글, 카카오톡 메시지, 투자 제안 내용을 붙여넣으세요..."
                className="w-full h-40 bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50 resize-none"
                maxLength={5000}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[#8b949e] text-xs self-center">예시:</span>
                {EXAMPLE_TEXTS.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => setText(ex.text)}
                    className="px-2.5 py-1 rounded-lg bg-[#21262d] text-[#8b949e] text-xs hover:text-[#e6edf3] hover:bg-[#30363d] transition-colors border border-[#30363d]"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* YOUTUBE MODE */}
          {mode === "youtube" && (
            <>
              <div className="mb-3">
                <label className="text-[#8b949e] text-xs font-medium block mb-2">YouTube URL</label>
                <div className="relative">
                  <Link2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b949e]" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... 또는 youtu.be/..."
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-[#0d1117]/60 border border-[#21262d] p-3 flex gap-2">
                <Youtube size={13} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[#8b949e] text-xs">
                  영상 제목, 채널명, 자막(자동 생성 포함)을 자동으로 추출해 분석합니다.
                  Shorts URL도 지원합니다.
                </p>
              </div>
            </>
          )}

          {/* SNS MODE */}
          {mode === "sns" && (
            <>
              <div className="mb-3">
                <label className="text-[#8b949e] text-xs font-medium block mb-2">SNS URL</label>
                <div className="relative">
                  <Link2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b949e]" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.instagram.com/p/... 또는 tiktok.com/..."
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50"
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#8b949e] text-xs font-medium">게시글 캡션/설명 <span className="text-red-400">*</span></label>
                  <span className="text-[#8b949e] text-xs font-mono">{extraText.length}/3000</span>
                </div>
                <textarea
                  value={extraText}
                  onChange={(e) => setExtraText(e.target.value)}
                  placeholder="인스타그램/틱톡 게시글의 캡션이나 설명을 복사해서 붙여넣으세요..."
                  className="w-full h-32 bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-[#e6edf3] text-sm placeholder-[#8b949e]/50 focus:outline-none focus:border-[#f0a500]/50 resize-none"
                  maxLength={3000}
                />
              </div>
              <div className="rounded-lg bg-[#0d1117]/60 border border-[#21262d] p-3 flex gap-2">
                <Instagram size={13} className="text-pink-400 shrink-0 mt-0.5" />
                <p className="text-[#8b949e] text-xs">
                  Instagram/TikTok은 API 정책상 자동 추출이 불가합니다.
                  게시글 캡션을 직접 복사해 붙여넣으면 URL과 함께 분석합니다.
                </p>
              </div>
            </>
          )}

          {/* Submit button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={mode === "text" ? analyzeText : analyzeUrl}
              disabled={!canSubmit || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f0a500] text-[#0d1117] font-semibold text-sm hover:bg-[#f0a500]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0d1117]/30 border-t-[#0d1117] rounded-full animate-spin" />
                  {mode === "youtube" ? "자막 추출 중..." : "분석 중..."}
                </>
              ) : (
                <>
                  <Search size={15} />
                  사기 여부 분석하기
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading panel */}
        {loading && (
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6 mb-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#e6edf3]">분석 진행 중</h3>
              <span className="text-xs text-[#8b949e] font-mono">단계 {analysisStage + 1} / {ANALYSIS_STAGES.length}</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-[#0d1117] rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-[#f0a500] rounded-full transition-all duration-500"
                style={{ width: `${((analysisStage + 1) / ANALYSIS_STAGES.length) * 100}%` }}
              />
            </div>
            <div className="space-y-2">
              {ANALYSIS_STAGES.map((stage, i) => (
                <div key={i} className={`flex items-center gap-3 py-1.5 transition-all duration-300 ${i > analysisStage ? "opacity-30" : ""}`}>
                  {i < analysisStage ? (
                    <CheckCircle2 size={15} className="text-green-400 shrink-0" />
                  ) : i === analysisStage ? (
                    <Loader2 size={15} className="text-[#f0a500] shrink-0 animate-spin" />
                  ) : (
                    <Circle size={15} className="text-[#30363d] shrink-0" />
                  )}
                  <span className={`text-xs ${i === analysisStage ? "text-[#e6edf3] font-semibold" : i < analysisStage ? "text-green-400/80" : "text-[#8b949e]"}`}>
                    {stage.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 mb-4 flex gap-3">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && <ResultPanel result={result} />}

        {/* Disclaimer */}
        <div className="mt-6 flex gap-2 text-[#8b949e] text-xs">
          <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
          <p>AI 판별 결과는 참고용이며 법적 효력이 없습니다. 실제 피해 시 경찰(182), 금감원(1332), 소비자원(1372)에 신고하세요.</p>
        </div>
      </div>
    </div>
  );
}
