import { getAdminClient } from "./supabase-admin";

interface LogAnalysisData {
  type: "text" | "youtube" | "sns";
  riskLevel?: string;
  riskScore?: number;
  scamType?: string;
  aiCalled?: boolean;
  ipHash?: string;
}

/** Fire-and-forget: logs analysis result to Supabase analysis_logs table */
export function logAnalysis(data: LogAnalysisData): void {
  const client = getAdminClient();
  if (!client) return;

  void client
    .from("analysis_logs")
    .insert({
      type: data.type,
      risk_level: data.riskLevel ?? null,
      risk_score: data.riskScore ?? null,
      scam_type: data.scamType ?? null,
      ai_called: data.aiCalled ?? true,
      ip_hash: data.ipHash ?? null,
    });
}
