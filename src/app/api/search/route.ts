import { NextResponse } from "next/server";

import { getHomePageData } from "@/data/home";
import { fetchProducts } from "@/data/products";
import { coalesceSearchResults } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  const [homeData, productList] = await Promise.all([
    getHomePageData(),
    fetchProducts({
      limit: query ? 48 : 32,
      search: query || undefined,
    }),
  ]);

  const { context, results } = coalesceSearchResults(
    productList,
    homeData.journal,
    query,
  );

  return NextResponse.json({
    query,
    tokens: context.tokens,
    results,
  });
}
