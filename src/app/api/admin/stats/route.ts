import { NextResponse } from "next/server";
import { getAdminClient, isAdminDbConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminDbConfigured()) {
    return NextResponse.json({ error: "DB가 설정되지 않았습니다." }, { status: 503 });
  }

  const db = getAdminClient()!;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [todayRes, totalRes, pendingRes, dailyRes, typesRes, recentRes] =
    await Promise.all([
      // 오늘 분석 수
      db
        .from("analysis_logs")
        .select("risk_level", { count: "exact" })
        .gte("created_at", todayStart.toISOString()),

      // 누적 분석 수
      db.from("analysis_logs").select("risk_level", { count: "exact" }),

      // 미처리 제보 수
      db
        .from("reports")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 최근 7일 일별 분석 수
      db
        .from("analysis_logs")
        .select("created_at, risk_level")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true }),

      // 사기 유형 Top 5
      db
        .from("analysis_logs")
        .select("scam_type")
        .not("scam_type", "is", null)
        .gte("created_at", sevenDaysAgo.toISOString()),

      // 최근 분석 로그 15건
      db
        .from("analysis_logs")
        .select("id, created_at, type, risk_level, risk_score, scam_type")
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

  // 오늘 위험 감지 (high + critical)
  const todayData = todayRes.data ?? [];
  const todayHigh = todayData.filter(
    (r) => r.risk_level === "high" || r.risk_level === "critical"
  ).length;

  // 전체 위험 감지
  const totalData = totalRes.data ?? [];
  const totalHigh = totalData.filter(
    (r) => r.risk_level === "high" || r.risk_level === "critical"
  ).length;

  // 일별 집계
  const dailyMap: Record<string, { count: number; high_count: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = { count: 0, high_count: 0 };
  }
  for (const row of dailyRes.data ?? []) {
    const key = row.created_at.slice(0, 10);
    if (dailyMap[key]) {
      dailyMap[key].count++;
      if (row.risk_level === "high" || row.risk_level === "critical") {
        dailyMap[key].high_count++;
      }
    }
  }
  const daily_stats = Object.entries(dailyMap).map(([date, v]) => ({
    date,
    ...v,
  }));

  // 사기 유형 Top 5
  const typeCount: Record<string, number> = {};
  for (const row of typesRes.data ?? []) {
    if (row.scam_type) typeCount[row.scam_type] = (typeCount[row.scam_type] ?? 0) + 1;
  }
  const scam_types = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([scam_type, count]) => ({ scam_type, count }));

  return NextResponse.json({
    today: { total: todayRes.count ?? 0, high: todayHigh },
    total: { total: totalRes.count ?? 0, high: totalHigh },
    pending_reports: pendingRes.count ?? 0,
    daily_stats,
    scam_types,
    recent_logs: recentRes.data ?? [],
  });
}
