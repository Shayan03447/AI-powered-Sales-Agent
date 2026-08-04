/**
 * Edge-safe session verify for middleware (Web Crypto).
 * Must match signing in lib/auth/index.ts (HMAC-SHA256 + base64url).
 */

export const SESSION_COOKIE = "atrium_session";

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return bytesToBase64Url(sig);
}

export async function verifySessionTokenEdge(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token || !token.includes(".") || !secret) return false;

  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;

    const expected = await hmacSign(payload, secret);
    if (sig.length !== expected.length) return false;

    // timing-safe-ish compare
    let diff = 0;
    for (let i = 0; i < sig.length; i++) {
      diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (diff !== 0) return false;

    const json = new TextDecoder().decode(base64UrlToBytes(payload));
    const data = JSON.parse(json) as { u?: string; exp?: number; nonce?: string };
    if (!data.u || !data.exp || Date.now() > data.exp) return false;

    // Reject tokens from a previous server boot.
    const bootNonce = process.env.NEXT_PUBLIC_SERVER_BOOT_NONCE ?? "";
    if (bootNonce && data.nonce !== bootNonce) return false;

    return true;
  } catch {
    return false;
  }
}
