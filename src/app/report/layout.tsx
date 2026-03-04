import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "피해 사례 제보",
  description:
    "강연·교육·투자 사기 피해 사례를 익명으로 제보해 다른 피해자를 막아주세요. 제보된 사례는 AI 판별 데이터베이스에 반영됩니다.",
  openGraph: {
    title: "피해 사례 제보 | 사기감별사",
    description: "사기 피해 사례를 익명으로 제보해 다른 피해자를 막아주세요.",
    url: "https://cheating-henna.vercel.app/report",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://cheating-henna.vercel.app/report",
  },
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
