import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "atrium_session";

/**
 * How long the JWT payload stays valid (server-side check).
 * The browser cookie itself is a session cookie — it disappears when
 * the browser is closed, so the user must log in again on every new
 * browser session regardless of this value.
 */
const SESSION_DAYS = 1;

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

/**
 * Returns cookie options for the session cookie.
 * No `maxAge` or `expires` → browser session cookie.
 * The cookie is automatically deleted when the browser is closed,
 * so the user is always prompted to log in on a new browser session.
 *
 * Pass maxAgeSeconds=0 on logout to explicitly clear the cookie.
 */
export function sessionCookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    // Only set maxAge when explicitly provided (e.g. logout sets it to 0).
    ...(maxAgeSeconds !== undefined ? { maxAge: maxAgeSeconds } : {}),
  };
}
