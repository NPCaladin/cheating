import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 사기 판별기",
  description:
    "의심되는 광고 문구, 강의 소개글, 유튜브 링크를 붙여넣으면 AI가 즉시 사기 패턴을 분석합니다. 주식 리딩방, 성공팔이, 코인 사기 등 15개 유형 판별.",
  openGraph: {
    title: "AI 사기 판별기 | 사기감별사",
    description: "광고 문구를 붙여넣으면 AI가 즉시 사기 여부를 판별합니다.",
    url: "https://cheating-henna.vercel.app/detector",
  },
  alternates: {
    canonical: "https://cheating-henna.vercel.app/detector",
  },
};

export default function DetectorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
