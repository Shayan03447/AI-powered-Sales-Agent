import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getAdminCredentials,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  isBlocked,
  recordFailedAttempt,
  resetAttempts,
} from "@/lib/auth/rate-limit";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isBlocked(ip)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many failed attempts. Please wait 15 minutes and try again.",
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    let admin;
    try {
      admin = getAdminCredentials();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Auth is not configured. Add AUTH_USERNAME, AUTH_PASSWORD, AUTH_SECRET to .env.local",
        },
        { status: 500 }
      );
    }

    if (username !== admin.username || password !== admin.password) {
      const blocked = recordFailedAttempt(ip);
      return NextResponse.json(
        {
          ok: false,
          error: blocked
            ? "Too many failed attempts. Please wait 15 minutes and try again."
            : "Invalid username or password",
        },
        { status: blocked ? 429 : 401 }
      );
    }

    resetAttempts(ip);
    const token = createSessionToken(username);
    const response = NextResponse.json({ ok: true, message: "Logged in" });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
