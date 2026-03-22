import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, isAdminDbConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminDbConfigured()) {
    return NextResponse.json({ error: "DB가 설정되지 않았습니다." }, { status: 503 });
  }

  const db = getAdminClient()!;

  // 기간 파라미터: from, to (ISO string), 기본값 30일
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const logLimit = Math.min(Number(searchParams.get("log_limit") || "100"), 500);
  const logOffset = Number(searchParams.get("log_offset") || "0");

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = toParam ? new Date(toParam) : now;
  // to를 해당 날짜의 끝으로
  if (toParam && !toParam.includes("T")) {
    to.setHours(23, 59, 59, 999);
  }

  const fromISO = from.toISOString();
  const toISO = to.toISOString();

  // 기간 일수 계산
  const periodDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));

  const [todayRes, totalRes, pendingRes, periodRes, typesRes, recentRes, archiveRes, periodCountRes] =
    await Promise.all([
      // 오늘 분석 수
      db
        .from("analysis_logs")
        .select("risk_level, type, ip_hash", { count: "exact" })
        .gte("created_at", todayStart.toISOString()),

      // 누적 분석 수
      db.from("analysis_logs").select("risk_level", { count: "exact" }),

      // 미처리 제보 수
      db
        .from("reports")
        .select("id", { count: "exact" })
        .eq("status", "pending"),

      // 선택 기간 데이터 (집계용)
      db
        .from("analysis_logs")
        .select("created_at, risk_level, risk_score, type, response_time_ms, input_length, error, ip_hash, ai_result")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: true }),

      // 사기 유형 (선택 기간)
      db
        .from("analysis_logs")
        .select("scam_type")
        .not("scam_type", "is", null)
        .gte("created_at", fromISO)
        .lte("created_at", toISO),

      // 로그 (기간 + 페이징)
      db
        .from("analysis_logs")
        .select("id, created_at, type, risk_level, risk_score, scam_type, input_preview, input_length, meta_title, meta_channel, url_domain, response_time_ms, detected_signals_count, ai_result, error, ip_hash", { count: "exact" })
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false })
        .range(logOffset, logOffset + logLimit - 1),

      // 아카이브 건수
      db
        .from("analysis_logs_archive")
        .select("id", { count: "exact" }),

      // 선택 기간 총 건수
      db
        .from("analysis_logs")
        .select("id", { count: "exact" })
        .gte("created_at", fromISO)
        .lte("created_at", toISO),
    ]);

  // 오늘 통계
  const todayData = todayRes.data ?? [];
  const todayHigh = todayData.filter(
    (r) => r.risk_level === "high" || r.risk_level === "critical"
  ).length;
  const uniqueIpsToday = new Set(todayData.map((r) => r.ip_hash).filter(Boolean)).size;

  // 전체 위험 감지
  const totalData = totalRes.data ?? [];
  const totalHigh = totalData.filter(
    (r) => r.risk_level === "high" || r.risk_level === "critical"
  ).length;

  // 기간 데이터 집계
  const periodRows = periodRes.data ?? [];

  // 일별 집계
  const dailyMap: Record<string, { count: number; high_count: number }> = {};
  for (let i = 0; i < periodDays; i++) {
    const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = { count: 0, high_count: 0 };
  }
  for (const row of periodRows) {
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

  // 사기 유형 Top 10
  const typeCount: Record<string, number> = {};
  for (const row of typesRes.data ?? []) {
    if (row.scam_type) typeCount[row.scam_type] = (typeCount[row.scam_type] ?? 0) + 1;
  }
  const scam_types = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([scam_type, count]) => ({ scam_type, count }));

  // 분석 유형 비율
  const typeDistribution = { text: 0, youtube: 0, sns: 0 };
  for (const row of periodRows) {
    if (row.type in typeDistribution) {
      typeDistribution[row.type as keyof typeof typeDistribution]++;
    }
  }

  // 시간대별 (24h)
  const hourlyMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
  for (const row of periodRows) {
    const hour = new Date(row.created_at).getHours();
    hourlyMap[hour]++;
  }
  const hourly_distribution = Object.entries(hourlyMap).map(([hour, count]) => ({
    hour: Number(hour),
    count,
  }));

  // 위험도 점수 분포
  const riskScoreDist = { safe: 0, low: 0, medium: 0, high: 0, critical: 0 };
  for (const row of periodRows) {
    const score = row.risk_score;
    if (score == null) continue;
    if (score <= 20) riskScoreDist.safe++;
    else if (score <= 40) riskScoreDist.low++;
    else if (score <= 60) riskScoreDist.medium++;
    else if (score <= 80) riskScoreDist.high++;
    else riskScoreDist.critical++;
  }

  // 평균 응답 시간
  const responseTimes = periodRows
    .map((r) => r.response_time_ms)
    .filter((t): t is number => t != null && t > 0);
  const avg_response_time_ms = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  // 에러율
  const errorCount = periodRows.filter((r) => r.error === true).length;
  const error_rate = periodRows.length > 0
    ? Math.round((errorCount / periodRows.length) * 1000) / 10
    : 0;

  // 고유 사용자 (기간)
  const uniqueIpsPeriod = new Set(periodRows.map((r) => r.ip_hash).filter(Boolean)).size;

  // 평균 입력 길이
  const inputLengths = periodRows
    .map((r) => r.input_length)
    .filter((l): l is number => l != null && l > 0);
  const avg_input_length = inputLengths.length > 0
    ? Math.round(inputLengths.reduce((a, b) => a + b, 0) / inputLengths.length)
    : 0;

  // 가장 많이 감지된 위험 신호 Top 10
  const signalCount: Record<string, number> = {};
  for (const row of periodRows) {
    const aiResult = row.ai_result;
    if (aiResult && typeof aiResult === "object" && Array.isArray((aiResult as Record<string, unknown>).detectedSignals)) {
      for (const sig of (aiResult as Record<string, unknown>).detectedSignals as Array<{ signal?: string }>) {
        if (sig.signal) {
          signalCount[sig.signal] = (signalCount[sig.signal] ?? 0) + 1;
        }
      }
    }
  }
  const top_signals = Object.entries(signalCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([signal, count]) => ({ signal, count }));

  // 월별 추이
  const monthlyMap: Record<string, { count: number; high_count: number }> = {};
  for (const row of periodRows) {
    const month = row.created_at.slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { count: 0, high_count: 0 };
    monthlyMap[month].count++;
    if (row.risk_level === "high" || row.risk_level === "critical") {
      monthlyMap[month].high_count++;
    }
  }
  const monthly_stats = Object.entries(monthlyMap).map(([month, v]) => ({
    month,
    ...v,
  }));

  return NextResponse.json({
    // 메타
    period: { from: fromISO, to: toISO, days: periodDays },

    // KPI
    today: { total: todayRes.count ?? 0, high: todayHigh },
    total: { total: totalRes.count ?? 0, high: totalHigh },
    period_total: periodCountRes.count ?? 0,
    pending_reports: pendingRes.count ?? 0,

    // 집계
    daily_stats,
    scam_types,
    type_distribution: typeDistribution,
    hourly_distribution,
    risk_score_distribution: riskScoreDist,
    avg_response_time_ms,
    error_rate,
    unique_users_today: uniqueIpsToday,
    unique_users_period: uniqueIpsPeriod,
    avg_input_length,
    top_signals,
    archive_count: archiveRes.count ?? 0,
    monthly_stats,

    // 로그 (페이징)
    recent_logs: recentRes.data ?? [],
    logs_total: recentRes.count ?? 0,
    logs_offset: logOffset,
    logs_limit: logLimit,
  });
}
