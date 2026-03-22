import { NextResponse } from "next/server";
import { getAdminClient, isAdminDbConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/** POST — 90일 경과 로그를 아카이브로 이관 */
export async function POST() {
  if (!isAdminDbConfigured()) {
    return NextResponse.json({ error: "DB가 설정되지 않았습니다." }, { status: 503 });
  }

  const db = getAdminClient()!;

  const { data, error } = await db.rpc("archive_old_logs");

  if (error) {
    console.error("[archive] RPC failed:", error.message);
    return NextResponse.json({ error: "아카이브 실행 실패: " + error.message }, { status: 500 });
  }

  return NextResponse.json({
    archived_count: data ?? 0,
    message: `${data ?? 0}건의 로그가 아카이브되었습니다.`,
  });
}

/** GET — 아카이브 통계 */
export async function GET() {
  if (!isAdminDbConfigured()) {
    return NextResponse.json({ error: "DB가 설정되지 않았습니다." }, { status: 503 });
  }

  const db = getAdminClient()!;

  const [countRes, rangeRes] = await Promise.all([
    db.from("analysis_logs_archive").select("id", { count: "exact" }),
    db
      .from("analysis_logs_archive")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(1),
  ]);

  const oldestRes = await db
    .from("analysis_logs_archive")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  return NextResponse.json({
    total: countRes.count ?? 0,
    oldest: rangeRes.data?.[0]?.created_at ?? null,
    newest: oldestRes.data?.[0]?.created_at ?? null,
  });
}
