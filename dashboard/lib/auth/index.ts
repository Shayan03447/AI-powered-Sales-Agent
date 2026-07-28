import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "atrium_session";
const SESSION_DAYS = 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is missing in .env.local");
  }
  return secret;
}

export function getAdminCredentials() {
  const username = process.env.AUTH_USERNAME?.trim();
  const password = process.env.AUTH_PASSWORD?.trim();
  if (!username || !password) {
    throw new Error(
      "AUTH_USERNAME and AUTH_PASSWORD must be set in .env.local"
    );
  }
  return { username, password };
}

/** Create signed session token (Node runtime — API routes). */
export function createSessionToken(username: string): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp }),
    "utf8"
  ).toString("base64url");
  const sig = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

/** Verify session token (Node runtime). */
export function verifySessionToken(token: string | undefined): {
  ok: boolean;
  username?: string;
} {
  if (!token || !token.includes(".")) return { ok: false };

  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return { ok: false };

    const expected = createHmac("sha256", getSecret())
      .update(payload)
      .digest("base64url");

    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false };
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { u?: string; exp?: number };

    if (!data.u || !data.exp || Date.now() > data.exp) {
      return { ok: false };
    }

    return { ok: true, username: data.u };
  } catch {
    return { ok: false };
  }
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
