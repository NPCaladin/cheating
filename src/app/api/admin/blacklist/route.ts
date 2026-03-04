import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, isAdminDbConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminDbConfigured()) {
    return NextResponse.json({ error: "DB가 설정되지 않았습니다." }, { status: 503 });
  }

  const db = getAdminClient()!;
  const { data, error } = await db
    .from("blacklist")
    .select("*")
    .order("report_count", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ blacklist: data });
}

export async function POST(req: NextRequest) {
  if (!isAdminDbConfigured()) {
    return NextResponse.json({ error: "DB가 설정되지 않았습니다." }, { status: 503 });
  }

  const body = await req.json();
  const { entity_name, entity_type, scam_type, severity, notes } = body;

  if (!entity_name?.trim()) {
    return NextResponse.json({ error: "운영자/채널명을 입력해주세요." }, { status: 400 });
  }

  const db = getAdminClient()!;
  const { data, error } = await db
    .from("blacklist")
    .insert({
      entity_name: entity_name.trim(),
      entity_type: entity_type ?? "service",
      scam_type: scam_type ?? null,
      severity: severity ?? "medium",
      notes: notes ?? null,
      verified: true,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 등록된 항목입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: "등록 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id });
}
