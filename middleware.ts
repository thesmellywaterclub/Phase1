import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SELLER_PATH_REGEX = /^\/seller(\/|$)/;
const SELLER_REGISTRATION_REGEX = /^\/seller\/register(\/|$)/;
const ADMIN_PATH_REGEX = /^\/admin(\/|$)/;
const AUTH_TOKEN_COOKIE = "swc-auth-token";
const SELLER_ID_COOKIE = "swc-auth-seller";

type JwtPayload = {
  exp?: number;
  isAdmin?: boolean;
  sellerId?: string | null;
};

function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload = ""] = token.split(".");
    let normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddingNeeded = 4 - (normalized.length % 4 || 4);
    if (paddingNeeded && paddingNeeded < 4) {
      normalized = normalized.padEnd(normalized.length + paddingNeeded, "=");
    }
    const decoded =
      typeof atob === "function"
        ? atob(normalized)
        : "";
    if (!decoded) {
      return null;
    }
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function buildLoginRedirect(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  loginUrl.searchParams.set("next", nextPath);
  return loginUrl;
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(AUTH_TOKEN_COOKIE);
  response.cookies.delete(SELLER_ID_COOKIE);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isSellerPath = SELLER_PATH_REGEX.test(pathname);
  const isAdminPath = ADMIN_PATH_REGEX.test(pathname);

  if (!isSellerPath && !isAdminPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value ?? "";

  if (!token) {
    const response = NextResponse.redirect(buildLoginRedirect(request));
    clearAuthCookies(response);
    return response;
  }

  const payload = decodeJwt(token);
  const isExpired =
    !payload?.exp || payload.exp * 1000 <= Date.now();

  if (isExpired) {
    const response = NextResponse.redirect(buildLoginRedirect(request));
    clearAuthCookies(response);
    return response;
  }

  if (isAdminPath) {
    if (!payload?.isAdmin) {
      const response = NextResponse.redirect(new URL("/", request.url));
      clearAuthCookies(response);
      return response;
    }
    return NextResponse.next();
  }

  if (SELLER_REGISTRATION_REGEX.test(pathname)) {
    return NextResponse.next();
  }

  const sellerIdCookie = request.cookies.get(SELLER_ID_COOKIE)?.value ?? "";
  const sellerId = payload?.sellerId ?? sellerIdCookie;

  if (!sellerId) {
    const response = NextResponse.redirect(buildLoginRedirect(request));
    clearAuthCookies(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*", "/admin/:path*"],
};
