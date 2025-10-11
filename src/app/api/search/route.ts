import { NextResponse } from "next/server";

import { getHomePageData } from "@/data/home";
import { products } from "@/data/products";
import { coalesceSearchResults } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const homeData = await getHomePageData();
  const { context, results } = coalesceSearchResults(
    products,
    homeData.journal,
    query,
  );

  return NextResponse.json({
    query,
    tokens: context.tokens,
    results,
  });
}
