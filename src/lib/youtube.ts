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

/** fetch with AbortController timeout (default 8s) */
async function fetchWithTimeout(
  url: string,
  timeoutMs = 8000,
  headers?: Record<string, string>
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, headers });
  } finally {
    clearTimeout(timer);
  }
}

/** Browser-like headers to avoid YouTube bot detection */
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

/** Fetch via YouTube Data API v3 (requires YOUTUBE_API_KEY env var) */
async function fetchYoutubeDataAPI(videoId: string): Promise<YoutubeMeta | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
    const res = await fetchWithTimeout(url);
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
  const res = await fetchWithTimeout(oembedUrl);
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
 * Extract caption text from YouTube timedtext JSON3 format.
 * YouTube auto-generated captions (ASR) and manual subtitles both use this format.
 */
function parseCaptionJson(json: { events?: Array<{ segs?: Array<{ utf8?: string }> }> }): string {
  return (json.events ?? [])
    .flatMap((e) => (e.segs ?? []).map((s) => s.utf8 ?? ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch transcript by scraping YouTube page for captionTracks.
 * Uses bracket-matching to extract JSON (handles nested objects & multiline).
 * Sends browser-like User-Agent to ensure captionTracks data is included.
 */
async function fetchTranscriptDirect(videoId: string): Promise<string> {
  const pageRes = await fetchWithTimeout(
    `https://www.youtube.com/watch?v=${videoId}&hl=ko`,
    12000,
    BROWSER_HEADERS
  );
  if (!pageRes.ok) return "";
  const html = await pageRes.text();

  // Find "captionTracks":[ in the page source
  const ctIndex = html.indexOf('"captionTracks":[');
  if (ctIndex === -1) return "";

  // Use bracket-matching to extract the complete JSON array
  // (avoids regex failing on nested objects like "name":{"simpleText":"..."})
  const arrStart = ctIndex + '"captionTracks":['.length - 1; // points to '['
  let depth = 0;
  let arrEnd = arrStart;
  for (let i = arrStart; i < Math.min(arrStart + 200000, html.length); i++) {
    const ch = html[i];
    if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) { arrEnd = i; break; }
    }
  }
  if (arrEnd === arrStart) return ""; // bracket matching failed

  const captionData = html.slice(arrStart, arrEnd + 1);

  // Extract all baseUrl values (escaped JSON strings in the captionTracks array)
  const baseUrls = [...captionData.matchAll(/"baseUrl":"(https:[^"\\]*(?:\\.[^"\\]*)*)"/g)]
    .map((m) => m[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/"));

  // Extract corresponding languageCodes
  const langs = [...captionData.matchAll(/"languageCode":"([^"]+)"/g)]
    .map((m) => m[1]);

  if (baseUrls.length === 0) return "";

  // Prefer Korean track; fall back to first available
  const koIdx = langs.findIndex((l) => l === "ko");
  const pickedUrl = koIdx !== -1 && baseUrls[koIdx] ? baseUrls[koIdx] : baseUrls[0];

  const xmlRes = await fetchWithTimeout(pickedUrl + "&fmt=json3", 8000, BROWSER_HEADERS);
  if (!xmlRes.ok) return "";

  const json = await xmlRes.json() as {
    events?: Array<{ segs?: Array<{ utf8?: string }> }>;
  };

  return parseCaptionJson(json).slice(0, 6000);
}

export async function fetchYoutubeTranscript(videoId: string): Promise<string> {
  // Try direct scraping first (more reliable than youtube-transcript library)
  try {
    const direct = await fetchTranscriptDirect(videoId);
    if (direct.length > 0) return direct;
  } catch { /* fall through */ }

  // Fallback to library
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
