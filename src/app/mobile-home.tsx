"use client";

import Link from "next/link";
import {
  ShieldCheck,
  ScanSearch,
  TrendingUp,
  BookOpen,
  Zap,
  Users,
  AlertTriangle,
  Clipboard,
  ArrowRight,
  ChevronRight,
  MessageSquareWarning,
  Info,
} from "lucide-react";

const stats = [
  { value: "7조원+", label: "코인 사기 피해", color: "#E5253C" },
  { value: "14,255명", label: "리딩방 피해자", color: "#E5253C" },
  { value: "400%", label: "교육 사기 증가율", color: "#D97706" },
  { value: "3.3조원", label: "다단계 피해 규모", color: "#E5253C" },
];

const categories = [
  { id: "investment", name: "투자/재테크", icon: TrendingUp, count: 4, gradient: "from-red-100 to-orange-100", iconBg: "bg-gradient-to-br from-red-200 to-red-300", iconColor: "text-red-800", tags: ["리딩방", "코인", "AI매매"] },
  { id: "education", name: "강연/교육", icon: BookOpen, count: 5, gradient: "from-amber-100 to-yellow-100", iconBg: "bg-gradient-to-br from-amber-200 to-yellow-300", iconColor: "text-amber-900", tags: ["성공팔이", "부업강의"] },
  { id: "side-business", name: "부업/커머스", icon: Zap, count: 3, gradient: "from-blue-100 to-cyan-100", iconBg: "bg-gradient-to-br from-blue-200 to-blue-300", iconColor: "text-blue-900", tags: ["팀미션", "구매대행"] },
  { id: "real-estate-multi", name: "부동산/다단계", icon: Users, count: 3, gradient: "from-violet-100 to-purple-100", iconBg: "bg-gradient-to-br from-violet-200 to-purple-300", iconColor: "text-violet-900", tags: ["기획부동산", "다단계"] },
];

const signals = ["수익 보장 약속", "즉석 결정 강요", "비현실적 수익률", "자격 검증 불가", "선입금 요구", "다단계 구조", "환불 규정 불명확", "출금 차단"];

export default function MobileHome() {
  return (
    <div className="mobile-home">
      {/* ━━━ Hero ━━━ */}
      <section className="mh-hero">
        <div className="mh-hero-bg" />
        <div className="mh-hero-orb mh-hero-orb--1" />
        <div className="mh-hero-orb mh-hero-orb--2" />

        <div className="mh-hero-inner">
          <div className="mh-hero-header">
            <div className="mh-shield">
              <ShieldCheck size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="mh-brand">사기감별사</span>
            <span className="mh-badge">무료 공익</span>
          </div>

          <h1 className="mh-title">
            결제 전에
            <span className="mh-title-accent">꼭 확인하세요</span>
          </h1>
          <p className="mh-subtitle">
            의심되는 광고, 투자 제안, 강의 소개글을 붙여넣으면 AI가 즉시 사기 패턴을 분석합니다.
          </p>
        </div>
      </section>

      {/* ━━━ Input Card ━━━ */}
      <div className="mh-input-card">
        <div className="mh-input-bar" />
        <div className="mh-input-top">
          <div className="mh-input-dot" />
          <span className="mh-input-label">AI 사기 판별</span>
        </div>
        <textarea
          className="mh-textarea"
          placeholder="의심되는 문구, 메시지, 링크를 여기에 붙여넣으세요..."
          rows={4}
        />
        <div className="mh-input-bottom">
          <div className="mh-chips">
            <span className="mh-chip">텍스트</span>
            <span className="mh-chip">YouTube</span>
            <span className="mh-chip">SNS</span>
          </div>
          <Link href="/detector" className="mh-btn-go">
            <ShieldCheck size={16} />
            판별하기
          </Link>
        </div>
      </div>

      <div className="mh-wrap">
        {/* ━━━ Stats ━━━ */}
        <section className="mh-section">
          <div className="mh-sec-head">
            <div className="mh-sec-icon mh-sec-icon--red">
              <AlertTriangle size={13} />
            </div>
            <span>실제 피해 규모</span>
          </div>
          <div className="mh-stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="mh-stat">
                <div className="mh-stat-bar" style={{ background: s.color }} />
                <div className="mh-stat-val" style={{ color: s.color }}>{s.value}</div>
                <div className="mh-stat-name">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ━━━ Categories ━━━ */}
        <section className="mh-section">
          <div className="mh-sec-head">
            <div className="mh-sec-icon mh-sec-icon--blue">
              <BookOpen size={13} />
            </div>
            <span>사기 유형 백과</span>
          </div>
          <div className="mh-cats-grid">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.id} href={`/types#${cat.id}`} className="mh-cat">
                  <div className={`mh-cat-icon ${cat.iconBg}`}>
                    <Icon size={20} className={cat.iconColor} />
                  </div>
                  <div className="mh-cat-name">{cat.name}</div>
                  <div className="mh-cat-cnt">{cat.count}가지 유형</div>
                  <div className="mh-cat-tags">
                    {cat.tags.map((t) => (
                      <span key={t} className="mh-cat-tag">{t}</span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ━━━ Warning Signals ━━━ */}
        <section className="mh-section">
          <div className="mh-sec-head">
            <div className="mh-sec-icon mh-sec-icon--amber">
              <AlertTriangle size={13} />
            </div>
            <span>8대 위험 신호</span>
          </div>
          <div className="mh-signals-box">
            <div className="mh-signals-grid">
              {signals.map((s, i) => (
                <div key={s} className="mh-sig">
                  <span className="mh-sig-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mh-sig-t">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ Steps ━━━ */}
        <section className="mh-section">
          <div className="mh-sec-head">
            <div className="mh-sec-icon mh-sec-icon--green">
              <ShieldCheck size={13} />
            </div>
            <span>이렇게 이용하세요</span>
          </div>
          <div className="mh-steps">
            {[
              { n: "1", title: "문구 붙여넣기", desc: "의심되는 광고, 메시지, 유튜브 링크를 복사해 붙여넣기", cls: "mh-step-n--1" },
              { n: "2", title: "AI 패턴 분석", desc: "15개 유형, 302개 위험 문구 기준으로 즉시 분석", cls: "mh-step-n--2" },
              { n: "3", title: "위험도 확인", desc: "위험 점수, 사기 유형, 법적 분석까지 한눈에 확인", cls: "mh-step-n--3" },
            ].map((step) => (
              <div key={step.n} className="mh-step">
                <div className={`mh-step-n ${step.cls}`}>{step.n}</div>
                <div>
                  <div className="mh-step-title">{step.title}</div>
                  <div className="mh-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ━━━ Report ━━━ */}
        <section className="mh-section">
          <Link href="/report" className="mh-report">
            <div className="mh-report-ic">
              <MessageSquareWarning size={22} className="text-red-800" />
            </div>
            <div className="mh-report-body">
              <div className="mh-report-title">피해를 당하셨나요?</div>
              <div className="mh-report-desc">사례 제보로 다른 피해를 막을 수 있어요</div>
            </div>
            <div className="mh-report-go">
              <ChevronRight size={16} className="text-red-500" />
            </div>
          </Link>
        </section>

        {/* ━━━ Disclaimer ━━━ */}
        <div className="mh-disc">
          <Info size={15} className="text-[#64748B] shrink-0 mt-0.5" />
          <p>
            AI 판별 결과는 참고용이며 법적 효력이 없습니다. 피해 시{" "}
            <strong>경찰청(182)</strong>, <strong>금감원(1332)</strong>, <strong>소비자원(1372)</strong>에 신고하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
