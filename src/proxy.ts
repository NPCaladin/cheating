import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (per-instance)
// For distributed/production scale, replace with Upstash Redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_CONFIG: Record<string, { max: number; windowMs: number }> = {
  "/api/detect": { max: 10, windowMs: 60_000 },
  "/api/analyze-url": { max: 10, windowMs: 60_000 },
  "/api/report": { max: 5, windowMs: 60_000 },
};

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Clean up expired entries periodically to prevent memory leak
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 120_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const config = RATE_LIMIT_CONFIG[pathname];
  if (!config) return NextResponse.next();

  maybeCleanup();

  const ip = getClientIp(req);
  const key = `${ip}:${pathname}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return NextResponse.next();
  }

  if (entry.count >= config.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${retryAfter}초 후 다시 시도해주세요.` },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/detect", "/api/analyze-url", "/api/report"],
};
