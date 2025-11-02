import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SELLER_PATH_REGEX = /^\/seller(\/|$)/;
const SELLER_REGISTRATION_REGEX = /^\/seller\/register(\/|$)/;
const AUTH_TOKEN_COOKIE = "swc-auth-token";
const SELLER_ID_COOKIE = "swc-auth-seller";

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  loginUrl.searchParams.set("next", nextPath);
  return loginUrl;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!SELLER_PATH_REGEX.test(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value ?? "";

  if (SELLER_REGISTRATION_REGEX.test(pathname)) {
    if (!token) {
      return NextResponse.redirect(buildLoginRedirect(request));
    }
    return NextResponse.next();
  }

  const sellerId = request.cookies.get(SELLER_ID_COOKIE)?.value ?? "";

  if (!token || !sellerId) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*"],
};
