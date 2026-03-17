import { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 사기감별사",
  description: "사기감별사의 개인정보처리방침입니다. 수집 항목, 이용 목적, 보유 기간, 이용자 권리 등을 안내합니다.",
  openGraph: {
    title: "개인정보처리방침 | 사기감별사",
    description: "사기감별사의 개인정보처리방침입니다.",
  },
  alternates: {
    canonical: "https://cheating.vibelogic.net/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
