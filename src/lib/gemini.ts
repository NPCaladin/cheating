/** Attempt to repair truncated JSON by closing open structures */
function repairTruncatedJson(text: string): string {
  // Remove any trailing incomplete string value
  const lastQuoteIdx = text.lastIndexOf('"');
  if (lastQuoteIdx > 0) {
    // Check if we're inside an unclosed string
    const afterQuote = text.substring(lastQuoteIdx + 1).trim();
    if (!afterQuote || afterQuote === "," || afterQuote === "") {
      // Truncated mid-value, trim to last complete property
    }
  }

  // Count open brackets/braces and close them
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of text) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  // If in string, close it
  if (inString) text += '"';

  // Remove trailing comma
  text = text.replace(/,\s*$/, "");

  // Close open structures
  for (let i = 0; i < openBrackets; i++) text += "]";
  for (let i = 0; i < openBraces; i++) text += "}";

  return text;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface GeminiResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  maxOutputTokens = 8192
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const res = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        { role: "user", parts: [{ text: userMessage }] },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Gemini API error: ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message || "Gemini API error");
  }

  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error("Empty Gemini response");
  }

  // Check if response was truncated
  if (candidate.finishReason === "MAX_TOKENS") {
    console.warn("[Gemini] Response truncated (MAX_TOKENS). Consider increasing maxOutputTokens.");
  }

  // Gemini 2.5 may return thinking + text parts — take the last text part
  const textParts = candidate.content.parts.filter(
    (p: { text?: string }) => p.text !== undefined
  );
  let text = textParts[textParts.length - 1]?.text || "";

  // Strip markdown code blocks if present
  text = text.replace(/^```json\s*\n?/, "").replace(/\n?\s*```$/, "");

  // If truncated, try to repair JSON by closing open structures
  if (candidate.finishReason === "MAX_TOKENS") {
    text = repairTruncatedJson(text);
  }

  const usage = data.usageMetadata || {};

  return {
    content: text,
    inputTokens: usage.promptTokenCount || 0,
    outputTokens: usage.candidatesTokenCount || 0,
  };
}
