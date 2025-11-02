import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  apiFetch,
  ApiError,
  type ApiResponseEnvelope,
} from "@/lib/api-client";
import type {
  SellerOffer,
  SellerOfferOperation,
} from "@/data/seller";

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
    const response = await apiFetch<
      ApiResponseEnvelope<SellerOffer[]>
    >("/api/seller/offers", {
      token,
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const token = getAuthToken();
  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const payload = await request.json();
    const response = await apiFetch<
      ApiResponseEnvelope<{
        offer: SellerOffer;
        operation: SellerOfferOperation;
      }>
    >("/api/seller/offers", {
      method: "POST",
      json: payload,
      token,
    });

    const status = response.data.operation === "created" ? 201 : 200;
    return NextResponse.json(response, { status });
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
