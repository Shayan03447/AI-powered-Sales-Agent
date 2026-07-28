import { NextResponse } from "next/server";

/** @deprecated use /api/auth/login and /api/auth/logout */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Use POST /api/auth/login and POST /api/auth/logout",
  });
}
