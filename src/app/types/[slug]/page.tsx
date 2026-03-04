import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, CheckCircle, ExternalLink, ArrowLeft, Phone } from "lucide-react";
import scamTypesData from "../../../../data/scam-types.json";

const BASE_URL = "https://cheating-henna.vercel.app";

// ── Types ──────────────────────────────────────────────────────────────────

interface ScamType {
  id: string;
  name: string;
  shortName: string;
  severity: string;
  description: string;
  totalDamage?: string;
  totalVictims?: string;
  channels?: string[];
  baitPhrases?: string[];
  warningSignals?: string[];
  howToVerify?: string[];
  legalStatus?: string;
  reportTo?: string[];
  representativeCases?: { name: string; damage: string; victims: number | null; year: number }[];
}

interface Category {
  id: string;
  name: string;
  types: ScamType[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function findTypeBySlug(slug: string): { type: ScamType; category: Category } | null {
  for (const category of scamTypesData.categories as Category[]) {
    const type = category.types.find((t) => t.id === slug);
    if (type) return { type, category };
  }
  return null;
}

function getAllSlugs(): string[] {
  return (scamTypesData.categories as Category[]).flatMap((cat) =>
    cat.types.map((t) => t.id)
  );
}

const severityLabel: Record<string, string> = {
  high: "고위험",
  medium: "중위험",
  low: "저위험",
};

const severityColor: Record<string, string> = {
  high: "text-red-400 bg-red-400/10 border-red-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  low: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

// ── Static params ──────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = findTypeBySlug(slug);
  if (!found) return { title: "찾을 수 없는 페이지" };

  const { type, category } = found;
  const title = `${type.shortName} 사기란? 특징·위험 신호·피하는 법`;
  const description = `${type.name}: ${type.description} 미끼 문구, 위험 신호, 신고 방법까지 총정리.`;

  return {
    title,
    description,
    keywords: [type.name, type.shortName, `${type.shortName} 사기`, `${type.shortName} 특징`, "사기 판별"],
    openGraph: {
      title: `${title} | 사기감별사`,
      description,
      url: `${BASE_URL}/types/${slug}`,
    },
    alternates: {
      canonical: `${BASE_URL}/types/${slug}`,
    },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function ScamTypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = findTypeBySlug(slug);
  if (!found) notFound();

  const { type, category } = found;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `${type.shortName} 사기란 무엇인가요?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: type.description,
        },
      },
      ...(type.howToVerify
        ? [
            {
              "@type": "Question",
              name: `${type.shortName} 사기를 어떻게 구별하나요?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: type.howToVerify.join(" "),
              },
            },
          ]
        : []),
      ...(type.reportTo
        ? [
            {
              "@type": "Question",
              name: `${type.shortName} 사기 피해를 당하면 어디에 신고하나요?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: type.reportTo.join(", ") + "에 신고하세요.",
              },
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="min-h-screen">
        {/* Breadcrumb */}
        <div className="px-4 sm:px-6 pt-8 pb-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <Link href="/" className="hover:text-[#e6edf3] transition-colors">홈</Link>
              <span>/</span>
              <Link href="/types" className="hover:text-[#e6edf3] transition-colors">사기 유형</Link>
              <span>/</span>
              <span className="text-[#e6edf3]">{type.shortName}</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <section className="px-4 sm:px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs text-[#8b949e] bg-[#21262d] px-2.5 py-1 rounded-md border border-[#30363d]">
                {category.name}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${severityColor[type.severity] ?? severityColor.medium}`}>
                {severityLabel[type.severity] ?? type.severity}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#e6edf3] mb-4 leading-tight">
              {type.shortName} 사기란?<br />
              <span className="text-[#f0a500]">특징·위험 신호·피하는 법</span>
            </h1>

            <p className="text-[#8b949e] text-lg leading-relaxed mb-8 max-w-2xl">
              {type.description}
            </p>

            {/* Damage stats */}
            {(type.totalDamage || type.totalVictims) && (
              <div className="flex flex-wrap gap-4 mb-8">
                {type.totalDamage && (
                  <div className="px-4 py-3 rounded-xl border border-red-400/20 bg-red-400/5">
                    <div className="text-red-400 font-bold text-xl">{type.totalDamage}</div>
                    <div className="text-[#8b949e] text-xs mt-0.5">피해 규모</div>
                  </div>
                )}
                {type.totalVictims && (
                  <div className="px-4 py-3 rounded-xl border border-amber-400/20 bg-amber-400/5">
                    <div className="text-amber-400 font-bold text-xl">{type.totalVictims}</div>
                    <div className="text-[#8b949e] text-xs mt-0.5">피해자 수</div>
                  </div>
                )}
                {type.channels && (
                  <div className="px-4 py-3 rounded-xl border border-[#30363d] bg-[#161b22]">
                    <div className="text-[#e6edf3] font-medium text-sm">{type.channels.join(" · ")}</div>
                    <div className="text-[#8b949e] text-xs mt-0.5">주요 유포 채널</div>
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <Link
              href={`/detector`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#f0a500] text-[#0d1117] font-semibold text-sm hover:bg-[#f0a500]/90 transition-all"
            >
              <ShieldAlert size={16} />
              {type.shortName} 관련 문구 지금 분석하기
            </Link>
          </div>
        </section>

        {/* Content grid */}
        <section className="px-4 sm:px-6 pb-16">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Bait phrases */}
            {type.baitPhrases && type.baitPhrases.length > 0 && (
              <div className="rounded-2xl border border-red-400/20 bg-[#161b22] p-6">
                <h2 className="flex items-center gap-2 font-semibold text-[#e6edf3] mb-4">
                  <AlertTriangle size={16} className="text-red-400" />
                  자주 쓰는 미끼 문구
                </h2>
                <div className="space-y-2">
                  {type.baitPhrases.map((phrase) => (
                    <div
                      key={phrase}
                      className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-400/5 border border-red-400/10 text-sm text-[#e6edf3]"
                    >
                      <span className="text-red-400 mt-0.5 shrink-0">"</span>
                      {phrase}
                      <span className="text-red-400 mt-0.5 ml-auto shrink-0">"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning signals */}
            {type.warningSignals && type.warningSignals.length > 0 && (
              <div className="rounded-2xl border border-amber-400/20 bg-[#161b22] p-6">
                <h2 className="flex items-center gap-2 font-semibold text-[#e6edf3] mb-4">
                  <AlertTriangle size={16} className="text-amber-400" />
                  위험 신호
                </h2>
                <div className="space-y-2">
                  {type.warningSignals.map((signal, i) => (
                    <div key={signal} className="flex items-start gap-3 text-sm">
                      <span className="text-amber-400/60 font-mono text-xs w-5 shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[#e6edf3]">{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to verify */}
            {type.howToVerify && type.howToVerify.length > 0 && (
              <div className="rounded-2xl border border-green-400/20 bg-[#161b22] p-6">
                <h2 className="flex items-center gap-2 font-semibold text-[#e6edf3] mb-4">
                  <CheckCircle size={16} className="text-green-400" />
                  진위 확인 방법
                </h2>
                <div className="space-y-3">
                  {type.howToVerify.map((step, i) => (
                    <div key={step} className="flex items-start gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center text-green-400 text-xs shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[#8b949e] leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report to */}
            {type.reportTo && type.reportTo.length > 0 && (
              <div className="rounded-2xl border border-blue-400/20 bg-[#161b22] p-6">
                <h2 className="flex items-center gap-2 font-semibold text-[#e6edf3] mb-4">
                  <Phone size={16} className="text-blue-400" />
                  피해 발생 시 신고 기관
                </h2>
                <div className="space-y-2">
                  {type.reportTo.map((org) => (
                    <div
                      key={org}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-400/5 border border-blue-400/10 text-sm text-[#e6edf3]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      {org}
                    </div>
                  ))}
                </div>
                {type.legalStatus && (
                  <p className="mt-4 text-xs text-[#8b949e] leading-relaxed">
                    <span className="text-amber-400">법적 근거:</span> {type.legalStatus}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Representative cases */}
          {type.representativeCases && type.representativeCases.length > 0 && (
            <div className="max-w-4xl mx-auto mt-4">
              <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6">
                <h2 className="font-semibold text-[#e6edf3] mb-4">실제 피해 사례</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {type.representativeCases.map((c) => (
                    <div
                      key={c.name}
                      className="px-4 py-3 rounded-xl bg-[#0d1117] border border-[#21262d]"
                    >
                      <div className="text-[#e6edf3] text-sm font-medium mb-1">{c.name}</div>
                      <div className="text-red-400 text-sm font-bold">{c.damage}</div>
                      <div className="text-[#8b949e] text-xs mt-1">
                        {c.year}년{c.victims ? ` · 피해자 ${c.victims.toLocaleString()}명` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom nav */}
          <div className="max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/types"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#30363d] text-[#8b949e] text-sm hover:text-[#e6edf3] hover:border-[#8b949e] transition-colors"
            >
              <ArrowLeft size={14} />
              전체 사기 유형 보기
            </Link>
            <Link
              href="/detector"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#f0a500] text-[#0d1117] font-semibold text-sm hover:bg-[#f0a500]/90 transition-all"
            >
              <ShieldAlert size={14} />
              AI 판별기로 직접 확인하기
            </Link>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-400/30 text-red-400 text-sm hover:bg-red-400/10 transition-colors"
            >
              <ExternalLink size={14} />
              피해 제보하기
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
