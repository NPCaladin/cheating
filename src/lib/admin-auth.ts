import crypto from "crypto";

function getSecret(): string {
  return process.env.ADMIN_JWT_SECRET ?? "dev-secret-change-in-production";
}

export function createAdminToken(): string {
  const ts = String(Date.now());
  const hmac = crypto.createHmac("sha256", getSecret()).update(ts).digest("hex");
  return Buffer.from(`${ts}:${hmac}`).toString("base64url");
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const colonIdx = decoded.indexOf(":");
    if (colonIdx === -1) return false;

    const ts = decoded.slice(0, colonIdx);
    const hmac = decoded.slice(colonIdx + 1);
    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(ts)
      .digest("hex");

    if (expected.length !== hmac.length) return false;
    const match = crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(hmac, "hex")
    );
    if (!match) return false;

    // 8-hour expiry
    return Date.now() - parseInt(ts) < 8 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/** Extract and verify admin token from cookie header */
export function verifyAdminCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/);
  return match ? verifyAdminToken(match[1]) : false;
}
