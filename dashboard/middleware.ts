import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionTokenEdge } from "@/lib/auth/edge";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    // Already logged in → skip login page
    if (pathname === "/login") {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      const secret = process.env.AUTH_SECRET?.trim() || "";
      if (secret && (await verifySessionTokenEdge(token, secret))) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET?.trim() || "";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = secret
    ? await verifySessionTokenEdge(token, secret)
    : false;

  if (valid) {
    return NextResponse.next();
  }

  // APIs → 401 JSON
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized — please log in" },
      { status: 401 }
    );
  }

  // Pages → redirect to login
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
