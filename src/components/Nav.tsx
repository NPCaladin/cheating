"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/detector", label: "AI 판별기" },
  { href: "/types", label: "사기 유형 백과" },
  { href: "/report", label: "피해 제보" },
];

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 border-b border-[#30363d] bg-[#0d1117]/80 backdrop-blur-md sticky top-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#f0a500]/10 border border-[#f0a500]/30 flex items-center justify-center group-hover:bg-[#f0a500]/20 transition-colors">
            <ShieldAlert size={16} className="text-[#f0a500]" />
          </div>
          <span className="font-bold text-base tracking-tight">
            사기<span className="text-[#f0a500]">감별사</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-[#f0a500]/10 text-[#f0a500]"
                  : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-[#8b949e] hover:text-[#e6edf3] p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#30363d] bg-[#0d1117] px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium my-1 transition-colors ${
                pathname === item.href
                  ? "bg-[#f0a500]/10 text-[#f0a500]"
                  : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
