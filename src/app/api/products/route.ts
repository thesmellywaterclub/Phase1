import { NextResponse } from "next/server";

import { fetchProducts, type ProductGender } from "@/data/products";

function parseLimit(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

const GENDER_VALUES = new Set(["unisex", "men", "women", "other"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));
  const cursor = searchParams.get("cursor") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const genderParam = searchParams.get("gender");
  const gender = genderParam && GENDER_VALUES.has(genderParam)
    ? (genderParam as ProductGender)
    : undefined;
  const brandId = searchParams.get("brandId") ?? undefined;
  const includeInactive = searchParams.get("includeInactive") === "true";

  const items = await fetchProducts({
    limit,
    cursor,
    search,
    gender,
    brandId,
    includeInactive,
  });

  return NextResponse.json(items);
}
