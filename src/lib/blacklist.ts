import { getSupabaseClient } from "@/lib/supabase";

export interface BlacklistEntry {
  entityName: string;
  entityType: string;
  scamType: string;
  reportCount: number;
  severity: string;
  verified: boolean;
}

/**
 * Check if any text token or URL matches a blacklisted entity.
 * Returns the first matched entry, or null if none found or Supabase not configured.
 */
export async function checkBlacklist(
  text: string,
  url?: string
): Promise<BlacklistEntry | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // Build search candidates: words > 2 chars from text + URL
    const candidates: string[] = [];

    if (url) candidates.push(url);

    // Extract meaningful tokens (3+ chars) from text
    const tokens = text
      .split(/[\s,[\]()'"<>]/g)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3)
      .slice(0, 20); // limit to first 20 tokens

    candidates.push(...tokens);

    if (candidates.length === 0) return null;

    // Query blacklist for any matching entity_name or entity_url
    // Using ilike for partial matching on up to first 10 candidates
    const searchCandidates = candidates.slice(0, 10);

    const filters = searchCandidates
      .map((c) => `entity_name.ilike.%${c}%,entity_url.ilike.%${c}%`)
      .join(",");

    const { data, error } = await supabase
      .from("blacklist")
      .select("entity_name, entity_type, scam_type, report_count, severity, verified")
      .or(filters)
      .order("report_count", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const row = data[0];
    return {
      entityName: row.entity_name,
      entityType: row.entity_type,
      scamType: row.scam_type,
      reportCount: row.report_count,
      severity: row.severity,
      verified: row.verified,
    };
  } catch {
    // Graceful degradation: blacklist check failure should never break analysis
    return null;
  }
}
