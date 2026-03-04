"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Shield, LogOut } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/reports",   label: "제보 관리", icon: FileText },
  { href: "/admin/blacklist", label: "블랙리스트", icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[#21262d] bg-[#161b22] flex flex-col">
        <div className="px-4 py-5 border-b border-[#21262d]">
          <div className="text-[#f0a500] font-bold text-sm">사기감별사</div>
          <div className="text-[#8b949e] text-xs mt-0.5">어드민</div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-[#f0a500]/10 text-[#f0a500]"
                    : "text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8b949e] hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
            <LogOut size={15} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
