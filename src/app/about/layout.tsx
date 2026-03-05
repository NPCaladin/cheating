import { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 소개 | 사기감별사",
  description: "사기감별사는 AI 기반 사기 판별 공익 서비스입니다. 작동 원리, 데이터 출처, 운영 정보를 안내합니다.",
  openGraph: {
    title: "서비스 소개 | 사기감별사",
    description: "AI 기반 사기 판별 공익 서비스 사기감별사의 소개 페이지입니다.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
