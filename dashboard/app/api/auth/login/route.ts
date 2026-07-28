import { NextResponse } from "next/server";
import {
  createSessionToken,
  getAdminCredentials,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
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
      return NextResponse.json(
        { ok: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);
    const response = NextResponse.json({
      ok: true,
      message: "Logged in",
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
