import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

import {
  apiFetch,
  ApiError,
  type ApiResponseEnvelope,
} from "@/lib/api-client";
import type { SellerRegistrationResult } from "@/data/seller";

const AUTH_TOKEN_COOKIE = "swc-auth-token";

function extractBearerToken(headerValue: string | null): string | null {
  if (!headerValue) {
    return null;
  }
  const [scheme, token] = headerValue.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) {
    return token;
  }
  return null;
}

function getAuthToken(request: Request): string | null {
  const cookieToken = cookies().get(AUTH_TOKEN_COOKIE)?.value ?? null;
  if (cookieToken) {
    return cookieToken;
  }
  const headerToken = extractBearerToken(request.headers.get("authorization"));
  if (headerToken) {
    return headerToken;
  }
  const forwardedHeaders = headers();
  return extractBearerToken(forwardedHeaders.get("authorization"));
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: {
        message: "Not authenticated",
      },
    },
    { status: 401 }
  );
}

function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    const body =
      (error.body as Record<string, unknown> | null) ??
      ({
        error: {
          message: error.message,
        },
      } as const);
    return NextResponse.json(body, { status: error.status });
  }

  return NextResponse.json(
    {
      error: {
        message: "Unexpected server error",
      },
    },
    { status: 500 }
  );
}

function sanitizeToken(token: string | null): string | null {
  if (!token) {
    return null;
  }
  const trimmed = token.replace(/^"+|"+$/g, "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  const token = sanitizeToken(getAuthToken(request));
  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const payload = await request.json();
    const response =
      await apiFetch<ApiResponseEnvelope<SellerRegistrationResult>>(
        "/api/seller/register",
        {
          method: "POST",
          json: payload,
          token,
        }
      );
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: {
            message: "Invalid JSON payload",
          },
        },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
