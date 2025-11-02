import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  apiFetch,
  ApiError,
  type ApiResponseEnvelope,
} from "@/lib/api-client";
import type { CatalogVariantSearchItem } from "@/data/seller";

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

export async function GET(request: Request) {
  const token = getAuthToken();
  if (!token) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const searchParams = new URLSearchParams();
  const limitParam = url.searchParams.get("limit");
  const brandId = url.searchParams.get("brandId");
  const productId = url.searchParams.get("productId");

  if (limitParam) {
    searchParams.set("limit", limitParam);
  }
  if (brandId) {
    searchParams.set("brandId", brandId);
  }
  if (productId) {
    searchParams.set("productId", productId);
  }

  const queryString = searchParams.toString();
  const path = queryString ? `/api/catalog/variants?${queryString}` : "/api/catalog/variants";

  try {
    const response = await apiFetch<
      ApiResponseEnvelope<CatalogVariantSearchItem[]>
    >(path, {
      token,
    });
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
