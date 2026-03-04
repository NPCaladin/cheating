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
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
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

export async function fetchYoutubeTranscript(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "ko" });
    return transcript.map((t) => t.text).join(" ").slice(0, 4000);
  } catch {
    try {
      // Retry with default language if Korean subtitles unavailable
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      return transcript.map((t) => t.text).join(" ").slice(0, 4000);
    } catch {
      return "";
    }
  }
}
