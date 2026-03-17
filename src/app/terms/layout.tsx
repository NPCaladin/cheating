import { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | 사기감별사",
  description: "사기감별사의 이용약관입니다. 서비스 이용 조건, 면책 조항, 이용자 의무 등을 안내합니다.",
  openGraph: {
    title: "이용약관 | 사기감별사",
    description: "사기감별사의 이용약관입니다.",
  },
  alternates: {
    canonical: "https://cheating.vibelogic.net/terms",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
