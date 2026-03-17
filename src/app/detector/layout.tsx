import type { Metadata } from "next";

const BASE_URL = "https://cheating.vibelogic.net";

export const metadata: Metadata = {
  title: "AI 사기 판별기",
  description:
    "의심되는 광고 문구, 강의 소개글, 유튜브 링크를 붙여넣으면 AI가 즉시 사기 패턴을 분석합니다. 주식 리딩방, 성공팔이, 코인 사기 등 15개 유형 판별.",
  keywords: [
    "사기 판별기", "사기 확인", "AI 사기 분석", "광고 사기 확인",
    "유튜브 사기 판별", "투자 사기 확인", "리딩방 사기 판별",
  ],
  openGraph: {
    title: "AI 사기 판별기 | 사기감별사",
    description: "광고 문구를 붙여넣으면 AI가 즉시 사기 여부를 판별합니다.",
    url: `${BASE_URL}/detector`,
  },
  alternates: {
    canonical: `${BASE_URL}/detector`,
  },
};

export default function DetectorLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "AI 사기 판별기", item: `${BASE_URL}/detector` },
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
