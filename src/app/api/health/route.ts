import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      youtube: !!process.env.YOUTUBE_API_KEY,
      supabase: isSupabaseConfigured(),
    },
  });
}
