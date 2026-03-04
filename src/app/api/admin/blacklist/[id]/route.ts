import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, isAdminDbConfigured } from "@/lib/supabase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminDbConfigured()) {
    return NextResponse.json({ error: "DB가 설정되지 않았습니다." }, { status: 503 });
  }

  const { id } = await params;
  const body = await req.json();
  const allowed = ["entity_name", "entity_type", "scam_type", "severity", "notes", "verified"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "업데이트할 항목이 없습니다." }, { status: 400 });
  }

  const db = getAdminClient()!;
  const { error } = await db.from("blacklist").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: "업데이트 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminDbConfigured()) {
    return NextResponse.json({ error: "DB가 설정되지 않았습니다." }, { status: 503 });
  }

  const { id } = await params;
  const db = getAdminClient()!;
  const { error } = await db.from("blacklist").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
