import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  apiFetch,
  ApiError,
  type ApiResponseEnvelope,
} from "@/lib/api-client";
import type { SellerLocation } from "@/data/seller";

const AUTH_TOKEN_COOKIE = "swc-auth-token";

function getAuthToken(): string | null {
  return cookies().get(AUTH_TOKEN_COOKIE)?.value ?? null;
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

export async function GET() {
  const token = getAuthToken();
  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const response = await apiFetch<ApiResponseEnvelope<SellerLocation[]>>(
      "/api/seller/locations",
      {
        token,
      }
    );
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
