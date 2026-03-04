import { YoutubeTranscript } from "youtube-transcript";

export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface YoutubeMeta {
  title: string;
  channelName: string;
  thumbnail: string;
  description?: string;
  tags?: string[];
}

/** fetch with AbortController timeout, supports custom options */
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

/** Fetch via YouTube Data API v3 (requires YOUTUBE_API_KEY env var) */
async function fetchYoutubeDataAPI(videoId: string): Promise<YoutubeMeta | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
    const res = await fetchT(url, 8000);
    if (!res.ok) return null;

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    const snippet = item.snippet;
    return {
      title: snippet.title as string,
      channelName: snippet.channelTitle as string,
      thumbnail:
        snippet.thumbnails?.high?.url ??
        snippet.thumbnails?.default?.url ??
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      description: (snippet.description as string)?.slice(0, 2000) ?? undefined,
      tags: (snippet.tags as string[] | undefined)?.slice(0, 30) ?? [],
    };
  } catch {
    return null;
  }
}

/** Fetch via oEmbed (no API key required, limited fields) */
async function fetchYoutubeOEmbed(videoId: string): Promise<YoutubeMeta> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const res = await fetchT(oembedUrl, 8000);
  if (!res.ok) throw new Error("YouTube 영상 정보를 가져올 수 없습니다.");
  const data = await res.json();
  return {
    title: data.title as string,
    channelName: data.author_name as string,
    thumbnail: data.thumbnail_url as string,
  };
}

/**
 * Fetch YouTube video metadata.
 * Uses Data API v3 if YOUTUBE_API_KEY is set, otherwise falls back to oEmbed.
 */
export async function fetchYoutubeMeta(videoId: string): Promise<YoutubeMeta> {
  const dataApiResult = await fetchYoutubeDataAPI(videoId);
  if (dataApiResult) return dataApiResult;
  return fetchYoutubeOEmbed(videoId);
}

/**
 * Parse YouTube timedtext SRV3 XML format.
 * Extracts text from <s> word-level elements.
 */
function parseSrv3Xml(xml: string): string {
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

/**
 * Fetch transcript via YouTube's ANDROID Innertube player endpoint.
 * The ANDROID client returns timedtext URLs that are accessible server-side
 * (unlike WEB client URLs which return empty responses due to bot detection).
 */
async function fetchTranscriptAndroid(videoId: string): Promise<string> {
  // Step 1: Get INNERTUBE_API_KEY from page HTML
  const pageRes = await fetchT(`https://www.youtube.com/watch?v=${videoId}`, 12000);
  if (!pageRes.ok) return "";
  const html = await pageRes.text();

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) return "";
  const apiKey = apiKeyMatch[1];

  // Step 2: POST to /player endpoint with ANDROID client context
  const playerRes = await fetchT(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    8000,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
      }),
    }
  );
  if (!playerRes.ok) return "";

  const playerData = await playerRes.json() as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: Array<{ baseUrl: string; languageCode: string }>;
      };
    };
  };

  const captionTracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (captionTracks.length === 0) return "";

  // Prefer Korean track; fall back to first available
  const koTrack =
    captionTracks.find((t) => t.languageCode === "ko") ?? captionTracks[0];

  // Step 3: Fetch timedtext (SRV3 XML format)
  const xmlRes = await fetchT(koTrack.baseUrl, 8000);
  if (!xmlRes.ok) return "";
  const xml = await xmlRes.text();

  if (!xml || !xml.includes("<s")) return "";
  return parseSrv3Xml(xml).slice(0, 6000);
}

export async function fetchYoutubeTranscript(videoId: string): Promise<string> {
  // Primary: ANDROID player approach (bypasses YouTube server-side bot detection)
  try {
    const transcript = await fetchTranscriptAndroid(videoId);
    if (transcript.length > 0) return transcript;
  } catch { /* fall through */ }

  // Fallback: youtube-transcript library
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "ko" });
    if (transcript.length > 0) return transcript.map((t) => t.text).join(" ").slice(0, 5000);
  } catch { /* fall through */ }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map((t) => t.text).join(" ").slice(0, 5000);
  } catch {
    return "";
  }
}
