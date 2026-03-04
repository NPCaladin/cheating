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
  const { status } = await req.json();

  if (!["pending", "verified", "rejected"].includes(status)) {
    return NextResponse.json({ error: "올바르지 않은 상태값입니다." }, { status: 400 });
  }

  const db = getAdminClient()!;
  const { error } = await db
    .from("reports")
    .update({ status })
    .eq("id", id);

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
  const { error } = await db.from("reports").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
