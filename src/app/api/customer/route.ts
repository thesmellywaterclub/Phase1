import { NextResponse } from "next/server";

import { fetchCustomerProfile } from "@/data/customer";

export async function GET() {
  const profile = await fetchCustomerProfile();
  return NextResponse.json(profile);
}
