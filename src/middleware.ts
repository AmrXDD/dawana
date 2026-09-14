import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionSecret, verifySession } from "@/lib/auth/session";

/**
 * Gates the control room before any admin page renders.
 *
 * This is the fast check — a valid signature and expiry. The admin layout
 * then confirms the account is still active against the database, so a
 * switched-off account is turned away even with a token that hasn't expired.
 * The sign-in page is always let through, which is what keeps that second
 * check from ever looping.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const secret = sessionSecret();
  const session = secret
    ? await verifySession(request.cookies.get(SESSION_COOKIE)?.value, secret)
    : null;

  if (session) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
