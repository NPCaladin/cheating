import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

interface ReportPayload {
  scamType: string;
  title: string;
  description: string;
  damage?: string;
  platform?: string;
  operatorName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ReportPayload = await req.json();

    const { scamType, title, description, damage, platform, operatorName } = body;

    if (!scamType || !title || !description || description.length < 50) {
      return NextResponse.json(
        { error: "필수 항목(사기유형, 제목, 설명 50자 이상)을 입력해주세요." },
        { status: 400 }
      );
    }

    // If Supabase is not configured, return success without saving
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, saved: false, message: "제보가 접수되었습니다. (DB 미연결 — 로컬 처리)" });
    }

    const supabase = getSupabaseClient()!;

    // Insert into reports table
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .insert({
        scam_type: scamType,
        title,
        description,
        damage: damage || null,
        platform: platform || null,
        operator_name: operatorName || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (reportError) {
      console.error("Report insert error:", reportError);
      return NextResponse.json({ error: "제보 저장 중 오류가 발생했습니다." }, { status: 500 });
    }

    // If operator name provided, upsert into blacklist
    if (operatorName && operatorName.trim().length > 0) {
      const { error: blError } = await supabase.from("blacklist").upsert(
        {
          entity_type: "service",
          entity_name: operatorName.trim(),
          scam_type: scamType,
          report_count: 1,
          verified: false,
          severity: "medium",
        },
        {
          onConflict: "entity_name",
          ignoreDuplicates: false,
        }
      );

      // If upsert fails (e.g. entity already exists), increment report_count
      if (blError) {
        await supabase.rpc("increment_report_count", { p_entity_name: operatorName.trim() });
      }
    }

    return NextResponse.json({
      success: true,
      saved: true,
      reportId: reportData?.id,
      message: "제보가 접수되었습니다.",
    });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
