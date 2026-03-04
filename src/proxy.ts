import { NextRequest, NextResponse } from "next/server";

// ── Rate Limiting ───────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_CONFIG: Record<string, { max: number; windowMs: number }> = {
  "/api/detect":      { max: 10, windowMs: 60_000 },
  "/api/analyze-url": { max: 10, windowMs: 60_000 },
  "/api/report":      { max: 5,  windowMs: 60_000 },
};

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 120_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

// ── Admin Auth (Edge-compatible HMAC) ──────────────────────────────────────

async function verifyAdminTokenEdge(token: string): Promise<boolean> {
  try {
    const secret = process.env.ADMIN_JWT_SECRET ?? "dev-secret-change-in-production";

    // base64url decode
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    );

    const colonIdx = decoded.indexOf(":");
    if (colonIdx === -1) return false;
    const ts = decoded.slice(0, colonIdx);
    const receivedHex = decoded.slice(colonIdx + 1);

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ts));
    const expectedHex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedHex !== receivedHex) return false;
    return Date.now() - parseInt(ts) < 8 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// ── Proxy ──────────────────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin route protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const isPublic =
      pathname === "/admin/login" || pathname === "/api/admin/login";

    if (!isPublic) {
      const token = req.cookies.get("admin_token")?.value;
      const valid = token ? await verifyAdminTokenEdge(token) : false;

      if (!valid) {
        if (pathname.startsWith("/api/admin")) {
          return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    }

    return NextResponse.next();
  }

  // Rate limiting for public API routes
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
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/detect",
    "/api/analyze-url",
    "/api/report",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
