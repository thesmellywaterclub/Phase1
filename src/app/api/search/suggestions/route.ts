import { NextResponse } from "next/server";

import { products } from "@/data/products";
import { buildSearchSuggestions } from "@/lib/search";

export async function GET() {
  const suggestions = buildSearchSuggestions(products, 16);
  return NextResponse.json({ suggestions });
}
