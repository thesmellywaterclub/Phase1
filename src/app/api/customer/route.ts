import { NextResponse } from "next/server";

import { fetchCustomerProfile } from "@/data/customer";
import { ApiError } from "@/lib/api-client";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (!token) {
    return NextResponse.json(
      {
        error: {
          message: "Missing bearer token",
        },
      },
      { status: 401 },
    );
  }

  try {
    const profile = await fetchCustomerProfile(token);
    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        error.body ?? {
          error: {
            message: "Failed to fetch profile",
          },
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: {
          message: "Unexpected error fetching profile",
        },
      },
      { status: 500 },
    );
  }
}
