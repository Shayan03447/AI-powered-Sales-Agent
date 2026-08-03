/**
 * Simple in-memory rate limiter for the login endpoint.
 * Resets on server restart — sufficient for a single-admin dashboard.
 *
 * Limits: max 5 failed attempts per IP per window (15 minutes).
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

type Entry = { count: number; firstAt: number };

// Module-level store — persists across requests in the same process.
const store = new Map<string, Entry>();

/** Call this on every failed login attempt. Returns true if the IP is now blocked. */
export function recordFailedAttempt(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    store.set(ip, { count: 1, firstAt: now });
    return false;
  }

  entry.count += 1;
  return entry.count >= MAX_ATTEMPTS;
}

/** Returns true if the IP is currently blocked (too many recent failures). */
export function isBlocked(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry) return false;
  if (now - entry.firstAt > WINDOW_MS) {
    store.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

/** Reset on successful login so legitimate users aren't locked out. */
export function resetAttempts(ip: string): void {
  store.delete(ip);
}
