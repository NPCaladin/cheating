import type { Metadata } from "next";

const BASE_URL = "https://cheating.vibelogic.net";

export const metadata: Metadata = {
  title: "피해 사례 제보",
  description:
    "강연·교육·투자 관련 피해 사례를 익명으로 제보해 다른 피해자를 막아주세요. 제보된 사례는 AI 분석 데이터베이스에 반영됩니다.",
  keywords: [
    "사기 제보", "사기 피해 신고", "사기 신고 방법", "투자 사기 제보",
    "강연 사기 신고", "피해 사례 공유",
  ],
  openGraph: {
    title: "피해 사례 제보 | 사기감별사",
    description: "사기 피해 사례를 익명으로 제보해 다른 피해자를 막아주세요.",
    url: `${BASE_URL}/report`,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${BASE_URL}/report`,
  },
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "피해 사례 제보", item: `${BASE_URL}/report` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}
