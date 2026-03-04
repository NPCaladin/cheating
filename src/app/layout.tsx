import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const BASE_URL = "https://cheating-henna.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "사기감별사 — 강연·교육·투자 사기 AI 판별 공익 서비스",
    template: "%s | 사기감별사",
  },
  description:
    "결제 전 꼭 확인하세요. AI가 강연·교육·투자·부업 광고 문구를 즉시 분석해 사기 여부를 판별합니다. 15개 유형 사기 패턴 데이터베이스 기반 무료 공익 서비스.",
  keywords: [
    "사기 판별", "강연 사기", "교육 사기", "투자 사기", "주식 리딩방",
    "코인 리딩방", "성공팔이", "부업 사기", "AI 사기 분석", "사기 확인",
    "사기감별사", "다단계 사기", "보이스피싱", "사기 유형",
  ],
  authors: [{ name: "사기감별사" }],
  creator: "사기감별사",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "사기감별사",
    title: "사기감별사 — 강연·교육·투자 사기 AI 판별",
    description:
      "결제 전 꼭 확인하세요. AI가 광고 문구를 즉시 분석해 사기 여부를 판별합니다. 무료 공익 서비스.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "사기감별사 — AI 사기 판별 서비스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "사기감별사 — 강연·교육·투자 사기 AI 판별",
    description: "결제 전 꼭 확인하세요. AI가 광고 문구를 즉시 분석합니다.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "사기감별사",
    url: BASE_URL,
    description: "강연·교육·투자 사기 AI 판별 공익 서비스",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/detector?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 relative z-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
