export const runtime = "edge";

async function fetchT(
  url: string,
  timeoutMs: number,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseTimedtextXml(xml: string): string {
  // SRV3 format: <s> word-level elements
  if (xml.includes("<s")) {
    return [...xml.matchAll(/<s[^>]*>([^<]*)<\/s>/g)]
      .map((m) => m[1])
      .join(" ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }
  // Format 3: <p> paragraph elements
  return [...xml.matchAll(/<p[^>]*>([^<]*)<\/p>/g)]
    .map((m) => m[1])
    .join(" ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchTranscriptAndroid(videoId: string): Promise<string> {
  const pageRes = await fetchT(
    `https://www.youtube.com/watch?v=${videoId}`,
    12000
  );
  if (!pageRes.ok) return "";
  const html = await pageRes.text();

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) return "";
  const apiKey = apiKeyMatch[1];

  const playerRes = await fetchT(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    8000,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        context: {
          client: { clientName: "ANDROID", clientVersion: "20.10.38" },
        },
      }),
    }
  );
  if (!playerRes.ok) return "";

  const playerData = (await playerRes.json()) as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: Array<{ baseUrl: string; languageCode: string }>;
      };
    };
  };

  const captionTracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (captionTracks.length === 0) return "";

  const koTrack =
    captionTracks.find((t) => t.languageCode === "ko") ?? captionTracks[0];

  const xmlRes = await fetchT(koTrack.baseUrl, 8000);
  if (!xmlRes.ok) return "";
  const xml = await xmlRes.text();

  if (!xml || (!xml.includes("<s") && !xml.includes("<p"))) return "";
  return parseTimedtextXml(xml).slice(0, 6000);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("id") ?? "";

  if (!videoId) {
    return Response.json({ transcript: "" });
  }

  try {
    const transcript = await fetchTranscriptAndroid(videoId);
    return Response.json({ transcript });
  } catch (e) {
    console.error("[transcript-edge] error:", e);
    return Response.json({ transcript: "" });
  }
}
