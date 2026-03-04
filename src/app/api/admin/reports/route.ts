import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, isAdminDbConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminDbConfigured()) {
    return NextResponse.json({ error: "DB가 설정되지 않았습니다." }, { status: 503 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status"); // pending | verified | rejected | null(all)

  const db = getAdminClient()!;
  let query = db
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && ["pending", "verified", "rejected"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}
