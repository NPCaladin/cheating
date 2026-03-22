/** Attempt to repair truncated JSON by closing open structures */
function repairTruncatedJson(text: string): string {
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

  if (inString) text += '"';
  text = text.replace(/,\s*$/, "");
  for (let i = 0; i < openBrackets; i++) text += "]";
  for (let i = 0; i < openBraces; i++) text += "}";

  return text;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4.1-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";

interface GeminiResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export function isGeminiConfigured(): boolean {
  return !!OPENAI_API_KEY;
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  maxOutputTokens = 8192
): Promise<GeminiResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: maxOutputTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `OpenAI API error: ${res.status}`;
    const error = new Error(msg);
    (error as unknown as Record<string, number>).status = res.status;
    throw error;
  }

  const data = await res.json();

  const choice = data.choices?.[0];
  if (!choice?.message?.content) {
    throw new Error("Empty OpenAI response");
  }

  let text = choice.message.content;

  // Strip markdown code blocks if present
  text = text.replace(/^```json\s*\n?/, "").replace(/\n?\s*```$/, "");

  // If truncated, try to repair JSON
  if (choice.finish_reason === "length") {
    console.warn("[OpenAI] Response truncated (length). Consider increasing maxOutputTokens.");
    text = repairTruncatedJson(text);
  }

  const usage = data.usage || {};

  return {
    content: text,
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
  };
}
