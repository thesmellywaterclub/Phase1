import { NextResponse } from "next/server";

import { getHomePageData } from "@/data/home";

export async function GET() {
  const data = await getHomePageData();
  return NextResponse.json(data);
}
