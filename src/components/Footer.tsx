import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

const reportLinks = [
  { name: "경찰청 사이버수사대", href: "https://ecrm.police.go.kr", tel: "182" },
  { name: "금융감독원", href: "https://www.fss.or.kr", tel: "1332" },
  { name: "한국소비자원", href: "https://www.kca.go.kr", tel: "1372" },
  { name: "공정거래위원회", href: "https://www.ftc.go.kr", tel: "1372" },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[#30363d] bg-[#0d1117] mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/logo.png"
                alt="사기감별사 로고"
                width={36}
                height={36}
                className="rounded-md"
              />
              <span className="font-bold text-sm">사기<span className="text-[#f0a500]">감별사</span></span>
            </div>
            <p className="text-[#8b949e] text-xs leading-relaxed">
              강연·교육·투자 사기로부터 시민을 보호하는<br />
              AI 기반 공익 서비스입니다.
            </p>
            <p className="text-[#8b949e] text-xs mt-3">
              본 서비스는 참고용이며, 법적 효력이 없습니다.<br />
              실제 피해 발생 시 아래 기관에 신고하세요.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-semibold text-[#e6edf3] mb-3 uppercase tracking-wider">서비스</h3>
            <ul className="space-y-2">
              {[
                { href: "/detector", label: "AI 위험 패턴 분석" },
                { href: "/types", label: "사기 유형 백과" },
                { href: "/report", label: "피해 사례 제보" },
                { href: "/about", label: "서비스 소개" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#8b949e] hover:text-[#f0a500] text-xs transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Report contacts */}
          <div>
            <h3 className="text-xs font-semibold text-[#e6edf3] mb-3 uppercase tracking-wider">신고 기관</h3>
            <ul className="space-y-2">
              {reportLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[#8b949e] hover:text-[#f0a500] text-xs transition-colors group"
                  >
                    <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
                    {link.name}
                    <span className="text-[#f0a500]/60 font-mono">{link.tel}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#21262d] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[#8b949e] text-xs">
            © 2026 사기감별사. 공익 목적으로 제공되는 서비스입니다.
          </p>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/privacy" className="text-[#8b949e] hover:text-[#f0a500] transition-colors">
              개인정보처리방침
            </Link>
            <span className="text-[#30363d]">|</span>
            <Link href="/terms" className="text-[#8b949e] hover:text-[#f0a500] transition-colors">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
