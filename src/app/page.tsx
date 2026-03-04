"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert, Search, BookOpen, AlertTriangle, TrendingUp, Users, FileText, Zap, ChevronRight } from "lucide-react";

const stats = [
  { label: "2024 코인 사기 피해", value: "7조원+", sub: "최근 5년 누적" },
  { label: "주식 리딩방 피해자", value: "14,255명", sub: "2023-2024년" },
  { label: "교육 사기 증가율", value: "400%", sub: "2024→2025년" },
  { label: "다단계 피해 규모", value: "3.3조원", sub: "휴스템코리아 단일" },
];

const scamCategories = [
  {
    id: "investment",
    name: "투자/재테크 사기",
    icon: TrendingUp,
    count: 4,
    color: "text-red-400",
    bg: "bg-red-400/5",
    border: "border-red-400/20",
    examples: ["주식 리딩방", "코인 사기", "AI 자동매매"],
  },
  {
    id: "education",
    name: "강연/교육 사기",
    icon: BookOpen,
    count: 5,
    color: "text-amber-400",
    bg: "bg-amber-400/5",
    border: "border-amber-400/20",
    examples: ["성공팔이", "부업 강의", "자격증 사기"],
  },
  {
    id: "side-business",
    name: "부업/커머스 사기",
    icon: Zap,
    count: 3,
    color: "text-blue-400",
    bg: "bg-blue-400/5",
    border: "border-blue-400/20",
    examples: ["팀미션 사기", "스마트스토어", "구매대행"],
  },
  {
    id: "real-estate-multi",
    name: "부동산/다단계/기타",
    icon: Users,
    count: 3,
    color: "text-purple-400",
    bg: "bg-purple-400/5",
    border: "border-purple-400/20",
    examples: ["기획부동산", "불법 다단계", "도박 픽스터"],
  },
];

const warningSignals = [
  "수익 보장 약속",
  "즉석 결정 강요",
  "비현실적 수익률",
  "자격 검증 불가",
  "선입금 요구",
  "다단계 구조",
  "환불 규정 불명확",
  "출금 차단",
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-16 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#f0a500]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-red-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0a500]/10 border border-[#f0a500]/20 text-[#f0a500] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0a500] animate-pulse" />
            강연·교육·투자 사기 피해 2026년 4배 급증 — 결제 전에 확인하세요
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            <span className="text-[#e6edf3]">결제 전에 꼭 확인하세요</span>
            <br />
            <span className="text-[#f0a500]">AI가 즉시 판별합니다</span>
          </h1>

          <p className="text-[#8b949e] text-lg sm:text-xl max-w-2xl leading-relaxed mb-6">
            광고 문구를 붙여넣으면 사기 패턴을 초 단위로 분석합니다.
            강연·투자·부업·코인 15개 유형 데이터베이스 기반, 무료 공익 서비스입니다.
          </p>

          {/* Social proof */}
          <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-[#8b949e]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#f0a500] font-semibold">15개</span> 사기 유형 커버
            </div>
            <span className="text-[#30363d]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#f0a500] font-semibold">50+</span> 위험 문구 패턴
            </div>
            <span className="text-[#30363d]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#f0a500] font-semibold">무료</span> 공익 서비스
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/detector"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#f0a500] text-[#0d1117] font-semibold text-sm hover:bg-[#f0a500]/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search size={16} />
              지금 무료로 판별하기
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/types"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#21262d] text-[#e6edf3] font-medium text-sm border border-[#30363d] hover:bg-[#30363d] transition-all"
            >
              <BookOpen size={16} />
              사기 유형 알아보기
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 py-10 border-y border-[#21262d] bg-[#161b22]/50">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#f0a500] mb-1">{stat.value}</div>
              <div className="text-[#e6edf3] text-sm font-medium mb-0.5">{stat.label}</div>
              <div className="text-[#8b949e] text-xs">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bento grid */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* AI 판별기 card */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-[#30363d] bg-gradient-to-br from-[#161b22] to-[#0d1117] p-6 sm:p-8 group hover:border-[#f0a500]/40 transition-colors">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#f0a500]/5 rounded-full blur-2xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#f0a500]/10 text-[#f0a500] text-xs font-medium mb-4">
                  <Zap size={11} />
                  AI POWERED
                </div>
                <h2 className="text-2xl font-bold text-[#e6edf3] mb-3">
                  실시간 AI 사기 판별기
                </h2>
                <p className="text-[#8b949e] text-sm leading-relaxed mb-6">
                  광고 문구, 강의 소개글, 투자 제안서를 붙여넣으면
                  Claude AI가 즉시 사기 패턴을 분석하고 위험도를 평가합니다.
                </p>
                <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                    <div className="w-2 h-2 rounded-full bg-green-400/60" />
                    <span className="text-[#8b949e] text-xs ml-1">분석할 내용을 입력하세요</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 bg-[#21262d] rounded-full w-full" />
                    <div className="h-2 bg-[#21262d] rounded-full w-4/5" />
                    <div className="h-2 bg-[#21262d] rounded-full w-3/4" />
                  </div>
                </div>
                <Link
                  href="/detector"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f0a500] text-[#0d1117] font-semibold text-sm hover:bg-[#f0a500]/90 transition-all"
                >
                  판별 시작하기
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Warning signals */}
            <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle size={16} className="text-red-400" />
                <h2 className="font-semibold text-[#e6edf3] text-sm">8대 위험 신호</h2>
              </div>
              <div className="space-y-2">
                {warningSignals.map((signal, i) => (
                  <div
                    key={signal}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0d1117] border border-[#21262d]"
                  >
                    <span className="text-[#f0a500]/60 text-xs font-mono w-4 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[#e6edf3] text-xs">{signal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scam categories */}
            {scamCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/types#${cat.id}`}
                  className={`rounded-2xl border ${cat.border} ${cat.bg} p-5 hover:scale-[1.01] transition-transform group`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon size={20} className={cat.color} />
                    <span className={`text-xs font-mono ${cat.color} opacity-60`}>
                      {cat.count}가지 유형
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#e6edf3] text-sm mb-2">{cat.name}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.examples.map((ex) => (
                      <span
                        key={ex}
                        className="px-2 py-0.5 rounded-md bg-[#0d1117]/60 text-[#8b949e] text-xs border border-[#30363d]/50"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                  <div className={`flex items-center gap-1 mt-4 text-xs ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    자세히 보기 <ChevronRight size={12} />
                  </div>
                </Link>
              );
            })}

            {/* Report CTA */}
            <div className="lg:col-span-3 rounded-2xl border border-[#30363d] bg-gradient-to-r from-[#161b22] via-[#1a1f28] to-[#161b22] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#e6edf3] mb-1">피해를 당하셨나요?</h3>
                  <p className="text-[#8b949e] text-sm">
                    사례를 제보하면 다른 피해자를 막을 수 있습니다. 익명 제보 가능합니다.
                  </p>
                </div>
              </div>
              <Link
                href="/report"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-400/10 border border-red-400/30 text-red-400 text-sm font-medium hover:bg-red-400/20 transition-colors"
              >
                피해 사례 제보하기
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 py-16 border-t border-[#21262d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#e6edf3] mb-3">
              어떻게 판별하나요?
            </h2>
            <p className="text-[#8b949e]">3단계로 간단하게</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "문구 붙여넣기",
                desc: "의심되는 광고, 강의 소개글, 투자 제안 내용을 복사해 붙여넣습니다.",
                icon: FileText,
              },
              {
                step: "02",
                title: "AI 패턴 분석",
                desc: "Claude AI가 15개 사기 유형 패턴과 50+ 위험 문구를 기준으로 분석합니다.",
                icon: Zap,
              },
              {
                step: "03",
                title: "위험도 확인",
                desc: "위험 점수와 함께 어떤 사기 유형과 유사한지 구체적인 설명을 제공합니다.",
                icon: ShieldAlert,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative p-6 rounded-2xl border border-[#21262d] bg-[#161b22]">
                  <div className="text-5xl font-bold text-[#21262d] font-mono mb-4 absolute top-4 right-5">
                    {item.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#f0a500]/10 border border-[#f0a500]/20 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-[#f0a500]" />
                  </div>
                  <h3 className="font-semibold text-[#e6edf3] mb-2">{item.title}</h3>
                  <p className="text-[#8b949e] text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl border border-[#21262d] bg-[#161b22]/50 p-4 flex gap-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[#8b949e] text-xs leading-relaxed">
              <span className="text-amber-400 font-medium">이용 안내:</span>{" "}
              AI 판별 결과는 참고 자료이며 법적 효력이 없습니다. 최종 판단은 직접 하시기 바랍니다.
              피해가 발생했거나 확실히 의심되는 경우 <span className="text-[#e6edf3]">경찰청 사이버범죄신고(182)</span>,{" "}
              <span className="text-[#e6edf3]">금융감독원(1332)</span>,{" "}
              <span className="text-[#e6edf3]">한국소비자원(1372)</span>에 신고하세요.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
