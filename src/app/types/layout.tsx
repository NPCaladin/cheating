import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사기 유형 백과",
  description:
    "주식 리딩방, 코인 사기, 성공팔이, 부업 강의, 다단계 등 15개 사기 유형의 특징·미끼 문구·위험 신호·신고 방법을 정리한 사기 백과사전.",
  keywords: [
    "주식 리딩방 사기", "코인 리딩방", "성공팔이 뜻", "부업 강의 사기",
    "다단계 사기", "자격증 사기", "부동산 강연 사기", "사기 유형",
  ],
  openGraph: {
    title: "사기 유형 백과 | 사기감별사",
    description: "15개 사기 유형의 특징과 피하는 방법을 알아보세요.",
    url: "https://cheating-henna.vercel.app/types",
  },
  alternates: {
    canonical: "https://cheating-henna.vercel.app/types",
  },
};

export default function TypesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
