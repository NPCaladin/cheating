import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "사기감별사 - 강연·교육 사기 판별 공익 서비스",
  description: "AI 기반 사기 패턴 분석으로 강연, 교육, 투자 사기를 사전에 감별합니다. 15개 유형 사기 백과 + 실시간 AI 판별기 제공.",
  keywords: "사기 판별, 강연 사기, 교육 사기, 투자 사기, AI 판별기, 리딩방, 성공팔이",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
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
