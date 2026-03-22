import { getAdminClient } from "./supabase-admin";

interface LogAnalysisData {
  type: "text" | "youtube" | "sns";
  riskLevel?: string;
  riskScore?: number;
  scamType?: string;
  aiCalled?: boolean;
  ipHash?: string;
  inputPreview?: string;
  inputLength?: number;
  aiResult?: object;
  metaTitle?: string;
  metaChannel?: string;
  urlDomain?: string;
  detectedSignalsCount?: number;
  responseTimeMs?: number;
  error?: boolean;
}

/** Mask sensitive information (phone, ID, card, account numbers) */
export function maskSensitive(text: string): string {
  return text
    .replace(/\d{3}-\d{3,4}-\d{4}/g, "***-****-****")
    .replace(/\d{6}[-]?\d{7}/g, "******-*******")
    .replace(/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, "****-****-****-****")
    .replace(/\d{10,14}/g, (m) => m.slice(0, 3) + "*".repeat(m.length - 6) + m.slice(-3))
    .substring(0, 200);
}

/** Extract domain from URL string */
export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** Logs analysis result to Supabase analysis_logs table */
export async function logAnalysis(data: LogAnalysisData): Promise<void> {
  const client = getAdminClient();
  if (!client) return;

  const { error } = await client
    .from("analysis_logs")
    .insert({
      type: data.type,
      risk_level: data.riskLevel ?? null,
      risk_score: data.riskScore ?? null,
      scam_type: data.scamType ?? null,
      ai_called: data.aiCalled ?? true,
      ip_hash: data.ipHash ?? null,
      input_preview: data.inputPreview ?? null,
      input_length: data.inputLength ?? null,
      ai_result: data.aiResult ?? null,
      meta_title: data.metaTitle ?? null,
      meta_channel: data.metaChannel ?? null,
      url_domain: data.urlDomain ?? null,
      detected_signals_count: data.detectedSignalsCount ?? 0,
      response_time_ms: data.responseTimeMs ?? null,
      error: data.error ?? false,
    });

  if (error) {
    console.error("[log-analysis] insert failed:", error.message);
  }
}
