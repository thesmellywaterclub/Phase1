import { NextResponse } from "next/server";

import { fetchProducts } from "@/data/products";
import { buildSearchSuggestions } from "@/lib/search";

export async function GET() {
  const productList = await fetchProducts({ limit: 64 });
  const suggestions = buildSearchSuggestions(productList, 16);
  return NextResponse.json({ suggestions });
}
